import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductStatus } from "../src/generated/prisma";
import { catalog } from "../src/data/catalog";
import { products } from "../src/data/products";
import { slugify } from "../src/lib/slug";
import { buildCategorySlugResolver } from "../src/lib/categoryTree";

/**
 * Imports the live zeefit.ae catalogue into Postgres: 3 top / 9 mid / 55 end
 * categories, then every product, preserving each record's original numeric id
 * so existing URLs (/product?id=83, ?id=1&type=end-category) keep resolving.
 *
 * Idempotent — upserts on (legacyId, level) for categories and legacyId for
 * products, so re-running it refreshes rather than duplicates.
 */

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function truncate(input: string, max: number) {
  const text = input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/[\s,;:.-]+\S*$/, "") + "…";
}

async function seedCategories() {
  const slugFor = buildCategorySlugResolver(catalog);
  /** legacy END id -> Category.id, used to attach products. */
  const endIdToCuid = new Map<number, string>();
  let count = 0;

  for (const [topIndex, top] of catalog.entries()) {
    const topRow = await prisma.category.upsert({
      where: { legacyId_level: { legacyId: top.id, level: "TOP" } },
      create: { legacyId: top.id, level: "TOP", name: top.name, slug: slugFor("TOP", top.name), position: topIndex },
      update: { name: top.name, position: topIndex },
    });
    count++;

    for (const [midIndex, mid] of top.children.entries()) {
      const midRow = await prisma.category.upsert({
        where: { legacyId_level: { legacyId: mid.id, level: "MID" } },
        create: {
          legacyId: mid.id,
          level: "MID",
          name: mid.name,
          slug: slugFor("MID", mid.name, top.name),
          parentId: topRow.id,
          position: midIndex,
        },
        update: { name: mid.name, parentId: topRow.id, position: midIndex },
      });
      count++;

      for (const [endIndex, end] of mid.children.entries()) {
        const endRow = await prisma.category.upsert({
          where: { legacyId_level: { legacyId: end.id, level: "END" } },
          create: {
            legacyId: end.id,
            level: "END",
            name: end.name,
            slug: slugFor("END", end.name, mid.name),
            parentId: midRow.id,
            position: endIndex,
          },
          update: { name: end.name, parentId: midRow.id, position: endIndex },
        });
        endIdToCuid.set(end.id, endRow.id);
        count++;
      }
    }
  }

  console.log(`  categories: ${count} upserted`);
  return endIdToCuid;
}

async function seedProducts(endIdToCuid: Map<number, string>) {
  const usedSlugs = new Set(
    (await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug)
  );
  let created = 0;
  const orphans: number[] = [];

  for (const p of products) {
    const categoryId = endIdToCuid.get(p.endId);
    if (!categoryId) {
      orphans.push(p.id);
      continue;
    }

    let slug = slugify(p.name) || `product-${p.id}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${p.id}`;
    usedSlugs.add(slug);

    const data = {
      title: p.name,
      slug,
      sku: `ZF-${String(p.id).padStart(5, "0")}`,
      shortDescription: p.short || null,
      description: p.description || null,
      features: p.features || null,
      conditions: p.conditions || null,
      returnPolicy: p.returnPolicy || null,

      price: p.price,
      compareAtPrice: p.oldPrice && p.oldPrice > p.price ? p.oldPrice : null,

      // The legacy site carried no inventory data at all, so nothing is
      // invented here: tracking is off and the count is zero until a real
      // stock take happens in the admin panel.
      stock: 0,
      trackInventory: false,

      categoryId,
      primaryImage: p.image,
      gallery: p.gallery,
      sizes: p.sizes,
      colors: p.colors,

      // Seeded from existing copy so nothing ships with an empty SERP entry.
      // These are a floor, not finished work: editors are expected to rewrite
      // them, and the dashboard's SEO coverage meter counts what is still blank.
      seoTitle: truncate(p.name, 60),
      seoDescription: truncate(p.short || p.description, 160),

      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
    };

    await prisma.product.upsert({
      where: { legacyId: p.id },
      create: { legacyId: p.id, ...data },
      update: data,
    });
    created++;
  }

  console.log(`  products:   ${created} upserted`);
  if (orphans.length) {
    console.warn(`  ! ${orphans.length} product(s) reference an unknown end category: ${orphans.join(", ")}`);
  }
}

async function main() {
  console.log("Seeding zeefit catalogue…");
  const endIdToCuid = await seedCategories();
  await seedProducts(endIdToCuid);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
