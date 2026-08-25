"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const credentials = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export type SignInState = { error?: string };

/**
 * Sign-in is deliberately generic in failure: the same message covers "no such
 * user", "wrong password" and "account deactivated", so the form cannot be used
 * to enumerate which staff addresses exist.
 */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) return { error: "Those credentials were not recognised." };

  // Authenticated with Supabase, but that alone is not staff access — a
  // storefront customer has an auth.users row too.
  const profile = await prisma.profile.findUnique({ where: { id: data.user.id } });
  if (!profile || !profile.isActive) {
    await supabase.auth.signOut();
    return { error: "Those credentials were not recognised." };
  }

  const headerList = await headers();
  await prisma.$transaction([
    prisma.profile.update({ where: { id: profile.id }, data: { lastSeenAt: new Date() } }),
    prisma.auditLog.create({
      data: {
        actorId: profile.id,
        actorEmail: profile.email,
        actorRole: profile.role,
        action: "LOGIN",
        entity: "Profile",
        entityId: profile.id,
        summary: `${profile.email} signed in`,
        ipAddress: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: headerList.get("user-agent"),
      },
    }),
  ]);

  // Only allow relative paths back — an open redirect here would be handed to
  // every phishing attempt aimed at staff.
  const next = parsed.data.next;
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  redirect(target);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
