import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import CategoryManager, { type CategoryNode } from "@/components/admin/CategoryManager";

export const metadata: Metadata = {
  title: "Categories — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // Editors hold category:read but not category:write — they see the tree
  // read-only, which is why the gate here is the weaker permission.
  const staff = await requirePermission("category:read");

  const rows = await prisma.category.findMany({
    orderBy: [{ level: "asc" }, { position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      legacyId: true,
      level: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      parentId: true,
      position: true,
      isActive: true,
      seoTitle: true,
      seoDescription: true,
      _count: { select: { children: true, products: true } },
    },
  });

  const nodes: CategoryNode[] = rows.map((c) => ({
    id: c.id,
    legacyId: c.legacyId,
    level: c.level,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    imageUrl: c.imageUrl ?? "",
    parentId: c.parentId,
    position: c.position,
    isActive: c.isActive,
    seoTitle: c.seoTitle ?? "",
    seoDescription: c.seoDescription ?? "",
    childCount: c._count.children,
    productCount: c._count.products,
  }));

  return (
    <CategoryManager
      nodes={nodes}
      canWrite={can(staff.role, "category:write")}
      canDelete={can(staff.role, "category:delete")}
    />
  );
}
