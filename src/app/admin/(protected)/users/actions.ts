"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { Role } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Shown once, never stored: the temporary password for a new account. */
  credentials?: { email: string; password: string };
};

async function requestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

/**
 * A generated password the administrator hands over out of band.
 *
 * Supabase's built-in SMTP is rate-limited to a couple of messages an hour and
 * frequently does not reach real inboxes, so an invite-email flow would fail
 * silently and unpredictably. Creating the account outright and showing the
 * password once is the option that actually works without configuring SMTP.
 */
function generatePassword() {
  // base64url of 18 bytes: 24 characters, no ambiguous punctuation to misread.
  return randomBytes(18).toString("base64url");
}

/**
 * The last active administrator must never lose their own access, or the panel
 * becomes unadministrable and only a hand-written SQL update can recover it.
 */
async function wouldRemoveLastAdmin(targetId: string) {
  const target = await prisma.profile.findUnique({
    where: { id: targetId },
    select: { role: true, isActive: true },
  });
  if (!target || target.role !== "ADMIN" || !target.isActive) return false;

  const otherActiveAdmins = await prisma.profile.count({
    where: { role: "ADMIN", isActive: true, id: { not: targetId } },
  });
  return otherActiveAdmins === 0;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

const inviteSchema = z.object({
  email: z.email("Enter a valid email address"),
  fullName: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(120).nullable().default(null)
  ),
  role: z.enum(["ADMIN", "EDITOR"]),
});

export async function createStaffUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const auth = await authorize("user:write");
  if (!auth.ok) return { error: auth.error };

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const out: Record<string, string> = {};
    for (const i of parsed.error.issues) out[i.path.join(".") || "_form"] = i.message;
    return { fieldErrors: out };
  }

  const { email, fullName, role } = parsed.data;

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) return { fieldErrors: { email: "A staff account with that email already exists." } };

  const password = generatePassword();
  const supabase = createAdminClient();

  // The role travels in user metadata; the on_auth_user_created trigger reads it
  // when it creates the matching public.profiles row.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name: fullName ?? undefined },
  });

  if (error || !data.user) {
    console.error("createStaffUser failed", error);
    return { error: error?.message ?? "Could not create that account." };
  }

  // The trigger runs inside Supabase and may race this request; make sure the
  // profile exists and carries the requested role either way.
  await prisma.profile.upsert({
    where: { id: data.user.id },
    create: { id: data.user.id, email, fullName, role },
    update: { email, fullName, role },
  });

  const meta = await requestMeta();
  await prisma.auditLog.create({
    data: {
      actorId: auth.staff.id,
      actorEmail: auth.staff.email,
      actorRole: auth.staff.role,
      action: "CREATE",
      entity: "Profile",
      entityId: data.user.id,
      summary: `Created ${role} account for ${email}`,
      ...meta,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true, credentials: { email, password } };
}

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export async function setStaffRole(id: string, role: Role) {
  const auth = await authorize("user:write");
  if (!auth.ok) return { error: auth.error };

  if (id === auth.staff.id) {
    return { error: "You cannot change your own role. Ask another administrator." };
  }

  const existing = await prisma.profile.findUnique({
    where: { id },
    select: { email: true, role: true },
  });
  if (!existing) return { error: "That account no longer exists." };
  if (existing.role === role) return { ok: true };

  if (role !== "ADMIN" && (await wouldRemoveLastAdmin(id))) {
    return { error: "That is the only active administrator. Promote someone else first." };
  }

  const meta = await requestMeta();
  await prisma.$transaction([
    prisma.profile.update({ where: { id }, data: { role } }),
    prisma.auditLog.create({
      data: {
        actorId: auth.staff.id,
        actorEmail: auth.staff.email,
        actorRole: auth.staff.role,
        action: "ROLE_CHANGE",
        entity: "Profile",
        entityId: id,
        summary: `${existing.email}: ${existing.role} -> ${role}`,
        diff: { role: { from: existing.role, to: role } },
        ...meta,
      },
    }),
  ]);

  // The role is cached in the user's JWT for up to an hour. Revoking their
  // sessions forces a fresh token, so a demotion takes effect now rather than
  // whenever their token happens to expire.
  await revokeSessions(id);

  revalidatePath("/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Active / inactive
// ---------------------------------------------------------------------------

export async function setStaffActive(id: string, isActive: boolean) {
  const auth = await authorize("user:write");
  if (!auth.ok) return { error: auth.error };

  if (id === auth.staff.id) {
    return { error: "You cannot deactivate your own account." };
  }

  const existing = await prisma.profile.findUnique({ where: { id }, select: { email: true } });
  if (!existing) return { error: "That account no longer exists." };

  if (!isActive && (await wouldRemoveLastAdmin(id))) {
    return { error: "That is the only active administrator. Promote someone else first." };
  }

  const meta = await requestMeta();
  await prisma.$transaction([
    prisma.profile.update({ where: { id }, data: { isActive } }),
    prisma.auditLog.create({
      data: {
        actorId: auth.staff.id,
        actorEmail: auth.staff.email,
        actorRole: auth.staff.role,
        action: "UPDATE",
        entity: "Profile",
        entityId: id,
        summary: `${isActive ? "Reactivated" : "Deactivated"} ${existing.email}`,
        ...meta,
      },
    }),
  ]);

  if (!isActive) await revokeSessions(id);

  revalidatePath("/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Removes the auth user; the profiles row goes with it via the ON DELETE CASCADE
 * added in 01_auth_bindings.sql. Audit rows survive — actorId is SET NULL and
 * actorEmail is denormalised precisely so the trail outlives the account.
 */
export async function deleteStaffUser(id: string) {
  const auth = await authorize("user:write");
  if (!auth.ok) return { error: auth.error };

  if (id === auth.staff.id) return { error: "You cannot delete your own account." };

  const existing = await prisma.profile.findUnique({ where: { id }, select: { email: true, role: true } });
  if (!existing) return { error: "That account no longer exists." };

  if (await wouldRemoveLastAdmin(id)) {
    return { error: "That is the only active administrator. Promote someone else first." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) {
    console.error("deleteStaffUser failed", error);
    return { error: "Could not delete that account." };
  }

  const meta = await requestMeta();
  await prisma.auditLog.create({
    data: {
      actorId: auth.staff.id,
      actorEmail: auth.staff.email,
      actorRole: auth.staff.role,
      action: "DELETE",
      entity: "Profile",
      entityId: id,
      summary: `Deleted ${existing.role} account ${existing.email}`,
      ...meta,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function resetStaffPassword(id: string): Promise<UserActionState> {
  const auth = await authorize("user:write");
  if (!auth.ok) return { error: auth.error };

  const existing = await prisma.profile.findUnique({ where: { id }, select: { email: true } });
  if (!existing) return { error: "That account no longer exists." };

  const password = generatePassword();
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) {
    console.error("resetStaffPassword failed", error);
    return { error: "Could not reset that password." };
  }

  const meta = await requestMeta();
  await prisma.auditLog.create({
    data: {
      actorId: auth.staff.id,
      actorEmail: auth.staff.email,
      actorRole: auth.staff.role,
      action: "UPDATE",
      entity: "Profile",
      entityId: id,
      summary: `Reset password for ${existing.email}`,
      ...meta,
    },
  });

  await revokeSessions(id);
  revalidatePath("/admin/users");
  return { ok: true, credentials: { email: existing.email, password } };
}

/** Best-effort global sign-out. Never fails the surrounding action. */
async function revokeSessions(userId: string) {
  try {
    await createAdminClient().auth.admin.signOut(userId, "global");
  } catch (e) {
    console.error("Could not revoke sessions for", userId, e);
  }
}
