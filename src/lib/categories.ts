import "server-only";
import { prisma } from "@/lib/prisma";
import type { CategoryOption } from "@/components/admin/ProductForm";

/**
 * Leaf categories with their full breadcrumb, e.g.
 *   { name: "Watches", trail: "Men › Men Accessories › Watches" }
 *
 * The trail is not decoration: "Watches", "Sunglasses", "Tops", "Sandals" and
 * "Boots" each appear under both Men and Women, so a bare name in the picker
 * would be genuinely ambiguous.
 *
 * Products always attach to an END-level category; TOP and MID are derived by
 * walking up the tree.
 */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const rows = await prisma.category.findMany({
    where: { level: "END", isActive: true },
    orderBy: [{ parent: { parent: { position: "asc" } } }, { parent: { position: "asc" } }, { position: "asc" }],
    select: {
      id: true,
      name: true,
      parent: {
        select: { name: true, parent: { select: { name: true } } },
      },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    trail: [c.parent?.parent?.name, c.parent?.name, c.name].filter(Boolean).join(" › "),
  }));
}
