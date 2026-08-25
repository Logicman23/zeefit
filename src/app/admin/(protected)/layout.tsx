import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth/guard";
import { permissionsFor } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: "Zee Fit — Admin",
  // The panel must never be indexed, whatever a crawler stumbles onto.
  robots: { index: false, follow: false },
};

/**
 * Every authenticated admin route hangs off this layout. The (protected) route
 * group keeps /admin/login outside it, which is what stops the guard below from
 * redirect-looping the sign-in page into itself. Neither segment changes the URL.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative: reads profiles.role from Postgres, not the JWT claim.
  const staff = await requireStaff();

  return (
    <AdminShell
      staff={{ email: staff.email, fullName: staff.fullName, role: staff.role }}
      permissions={permissionsFor(staff.role)}
    >
      {children}
    </AdminShell>
  );
}
