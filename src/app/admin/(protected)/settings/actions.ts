"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth/guard";
import { SETTINGS, SETTING_BY_KEY, type SettingDef } from "@/lib/settings";

export type SettingsActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Per-type validation, built from the same registry the form renders from. */
function validator(def: SettingDef) {
  switch (def.type) {
    case "boolean":
      return z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
    case "number":
      return z.coerce.number().int("Whole numbers only").min(0, "Cannot be negative").max(100_000);
    case "email":
      return z.union([z.literal(""), z.email("Enter a valid email address")]);
    default: {
      let s = z.string().trim();
      if (def.maxLength) s = s.max(def.maxLength, `Keep to ${def.maxLength} characters or fewer`);
      return s;
    }
  }
}

export async function updateSettings(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const auth = await authorize("settings:write");
  if (!auth.ok) return { error: auth.error };

  const values: Record<string, string | number | boolean> = {};
  const fieldErrors: Record<string, string> = {};

  for (const def of SETTINGS) {
    // An unticked checkbox sends nothing at all, which is a legitimate `false`
    // rather than a missing field — so booleans are never skipped.
    const raw = formData.get(def.key);
    if (raw === null && def.type !== "boolean") continue;

    const parsed = validator(def).safeParse(raw ?? undefined);
    if (!parsed.success) {
      fieldErrors[def.key] = parsed.error.issues[0]?.message ?? "Invalid value";
      continue;
    }
    values[def.key] = parsed.data as string | number | boolean;
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  // Only persist what actually differs from the default, so the table stays a
  // record of deliberate choices rather than a copy of the defaults.
  const existing = await prisma.setting.findMany({ select: { key: true, value: true } });
  const current = new Map(existing.map((e) => [e.key, e.value]));
  const changed: string[] = [];

  const writes = [];
  for (const [key, value] of Object.entries(values)) {
    const def = SETTING_BY_KEY.get(key)!;
    const before = current.has(key) ? current.get(key) : def.default;
    if (before === value) continue;
    changed.push(key);

    if (value === def.default) {
      // Back to the default: drop the row rather than storing a duplicate of it.
      if (current.has(key)) writes.push(prisma.setting.delete({ where: { key } }));
      continue;
    }
    writes.push(
      prisma.setting.upsert({
        where: { key },
        create: { key, value, group: def.group, updatedById: auth.staff.id },
        update: { value, group: def.group, updatedById: auth.staff.id },
      })
    );
  }

  if (changed.length === 0) return { ok: true };

  const h = await headers();
  writes.push(
    prisma.auditLog.create({
      data: {
        actorId: auth.staff.id,
        actorEmail: auth.staff.email,
        actorRole: auth.staff.role,
        action: "UPDATE",
        entity: "Setting",
        summary: `Updated ${changed.length} setting${changed.length === 1 ? "" : "s"}: ${changed.join(", ")}`,
        ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: h.get("user-agent"),
      },
    })
  );

  try {
    await prisma.$transaction(writes);
  } catch (e) {
    console.error("updateSettings failed", e);
    return { error: "Could not save those settings. Please try again." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  // Settings feed the storefront's metadata and footer, both rendered in the
  // shared layout — so the whole storefront cache goes.
  revalidatePath("/", "layout");
  return { ok: true };
}
