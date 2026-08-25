import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import UserManager, { type StaffRow } from "@/components/admin/UserManager";

export const metadata: Metadata = {
  title: "Users — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // ADMIN only. An Editor holds neither user:read nor user:write, so this
  // renders the 403 boundary for them rather than a page.
  const staff = await requirePermission("user:read");

  const rows = await prisma.profile.findMany({
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastSeenAt: true,
      createdAt: true,
      _count: { select: { productsCreated: true, productsUpdated: true } },
    },
  });

  const users: StaffRow[] = rows.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive,
    lastSeenAt: u.lastSeenAt ? u.lastSeenAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    productsTouched: u._count.productsCreated + u._count.productsUpdated,
    isSelf: u.id === staff.id,
  }));

  const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.isActive).length;

  return <UserManager users={users} activeAdmins={activeAdmins} />;
}
