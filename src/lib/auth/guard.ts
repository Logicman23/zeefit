import "server-only";
import { cache } from "react";
import { forbidden, redirect } from "next/navigation";
import type { Profile } from "@/generated/prisma";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { can, type Permission } from "./permissions";

/**
 * THE authorization boundary.
 *
 * Middleware only redirects — it is an optimisation, not a gate (CVE-2025-29927
 * showed middleware can be skipped outright, and Server Actions never pass
 * through a layout's checks in the first place). Every page and every mutating
 * action re-derives the caller's role here, from Postgres, on each request.
 *
 * `cache()` dedupes within a single render pass, so a layout, its page and a
 * nested component share one Auth round-trip and one profile query.
 */
export const getCurrentStaff = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  // getUser() revalidates the JWT against the Auth server on every call.
  // getSession() only decodes the cookie and must never be trusted server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });

  // No profile => an auth.users row exists without staff access (e.g. a
  // storefront customer). isActive false => access revoked without deleting
  // history. Both are "not staff".
  if (!profile || !profile.isActive) return null;

  return profile;
});

/** Page/layout guard: bounces anonymous or non-staff callers to sign-in. */
export async function requireStaff(): Promise<Profile> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

/** Page guard: renders the 403 boundary when the role lacks the permission. */
export async function requirePermission(permission: Permission): Promise<Profile> {
  const staff = await requireStaff();
  if (!can(staff.role, permission)) forbidden();
  return staff;
}

export type AuthzResult =
  | { ok: true; staff: Profile }
  | { ok: false; error: string };

/**
 * Server Action guard. Returns a value instead of throwing so the form can
 * render the refusal inline rather than blowing up the whole route.
 *
 * A Server Action is an independently addressable POST endpoint: the check in
 * admin/layout.tsx does NOT run before it. Every mutating action starts here.
 */
export async function authorize(permission: Permission): Promise<AuthzResult> {
  const staff = await getCurrentStaff();
  if (!staff) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!can(staff.role, permission)) {
    return { ok: false, error: "You do not have permission to perform this action." };
  }
  return { ok: true, staff };
}
