import "server-only";
import { prisma } from "./prisma";

/**
 * The storefront's read layer.
 *
 * Deliberately returns the same shapes the existing components already consume
 * (src/data/products.ts and src/data/catalog.ts), so switching the site from the
 * static files to Postgres is an import swap plus an await — not a rewrite of
 * every card, sidebar and detail view.
 *
 * Only PUBLISHED, non-deleted products are ever returned. Draft and archived
 * work is invisible here by construction rather than by a filter each caller has
 * to remember.
 */

export type StoreProduct = {
  /** Legacy numeric id, 0 for products created in the admin panel. */
  id: number;
  /** The canonical identifier for URLs. Every product has one. */
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string;
  gallery: string[];
  sizes: string[];
  colors: string[];
  short: string;
  description: string;
  features: string;
  conditions: string;
  returnPolicy: string;
  topId: number;
  midId: number;
  endId: number;
  inStock: boolean;
};

export type EndCategory = { id: number; name: string };
export type MidCategory = { id: number; name: string; children: EndCategory[] };
export type TopCategory = { id: number; name: string; children: MidCategory[] };

const PUBLISHED = { status: "PUBLISHED", deletedAt: null } as const;

/** Everything a card or detail view needs, including the ancestry for breadcrumbs. */
const productSelect = {
  legacyId: true,
  slug: true,
  title: true,
  price: true,
  compareAtPrice: true,
  primaryImage: true,
  gallery: true,
  sizes: true,
  colors: true,
  shortDescription: true,
  description: true,
  features: true,
  conditions: true,
  returnPolicy: true,
  stock: true,
  trackInventory: true,
  category: {
    select: {
      legacyId: true,
      parent: { select: { legacyId: true, parent: { select: { legacyId: true } } } },
    },
  },
} as const;

type Row = {
  legacyId: number | null;
  slug: string;
  title: string;
  price: unknown;
  compareAtPrice: unknown;
  primaryImage: string;
  gallery: string[];
  sizes: string[];
  colors: string[];
  shortDescription: string | null;
  description: string | null;
  features: string | null;
  conditions: string | null;
  returnPolicy: string | null;
  stock: number;
  trackInventory: boolean;
  category: {
    legacyId: number;
    parent: { legacyId: number; parent: { legacyId: number } | null } | null;
  };
};

/**
 * Decimal does not survive the Server/Client boundary, so prices are converted
 * to numbers here — at the edge of the data layer — rather than in each view.
 */
function toStoreProduct(p: Row): StoreProduct {
  return {
    id: p.legacyId ?? 0,
    slug: p.slug,
    name: p.title,
    price: Number(p.price),
    oldPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
    image: p.primaryImage,
    gallery: p.gallery,
    sizes: p.sizes,
    colors: p.colors,
    short: p.shortDescription ?? "",
    description: p.description ?? "",
    features: p.features ?? "",
    conditions: p.conditions ?? "",
    returnPolicy: p.returnPolicy ?? "",
    endId: p.category.legacyId,
    midId: p.category.parent?.legacyId ?? 0,
    topId: p.category.parent?.parent?.legacyId ?? 0,
    inStock: !p.trackInventory || p.stock > 0,
  };
}

// ---------------------------------------------------------------- categories

/** The full three-tier tree, in the shape the navigation components expect. */
export async function getCatalog(): Promise<TopCategory[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, legacyId: true, level: true, name: true, parentId: true },
  });

  const mids = rows.filter((r) => r.level === "MID");
  const ends = rows.filter((r) => r.level === "END");

  return rows
    .filter((r) => r.level === "TOP")
    .map((top) => ({
      id: top.legacyId,
      name: top.name,
      children: mids
        .filter((m) => m.parentId === top.id)
        .map((mid) => ({
          id: mid.legacyId,
          name: mid.name,
          children: ends
            .filter((e) => e.parentId === mid.id)
            .map((end) => ({ id: end.legacyId, name: end.name })),
        })),
    }));
}

const LEVEL_OF: Record<string, "TOP" | "MID" | "END"> = {
  "top-category": "TOP",
  "mid-category": "MID",
  "end-category": "END",
};

/** Resolves ?id=..&type=.. to a name plus its breadcrumb trail. */
export async function findCategory(
  legacyId: number,
  type: string
): Promise<{ name: string; trail: string[] } | null> {
  const level = LEVEL_OF[type];
  if (!level || !Number.isFinite(legacyId)) return null;

  const cat = await prisma.category.findUnique({
    where: { legacyId_level: { legacyId, level } },
    select: {
      name: true,
      isActive: true,
      parent: { select: { name: true, parent: { select: { name: true } } } },
    },
  });
  if (!cat || !cat.isActive) return null;

  const trail = [cat.parent?.parent?.name, cat.parent?.name, cat.name].filter(Boolean) as string[];
  return { name: cat.name, trail };
}

// ------------------------------------------------------------------ products

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const p = await prisma.product.findFirst({ where: { slug, ...PUBLISHED }, select: productSelect });
  return p ? toStoreProduct(p as Row) : null;
}

/** Supports the original /product?id=83 links, which are indexed and linked to. */
export async function getProductByLegacyId(legacyId: number): Promise<StoreProduct | null> {
  if (!Number.isFinite(legacyId)) return null;
  const p = await prisma.product.findFirst({
    where: { legacyId, ...PUBLISHED },
    select: productSelect,
  });
  return p ? toStoreProduct(p as Row) : null;
}

export async function getProductsInCategory(legacyId: number, type: string): Promise<StoreProduct[]> {
  const level = LEVEL_OF[type];
  if (!level || !Number.isFinite(legacyId)) return [];

  // A TOP or MID category shows everything beneath it, so the filter walks down
  // the tree rather than matching only the directly attached category.
  const where =
    level === "END"
      ? { category: { legacyId, level: "END" as const } }
      : level === "MID"
        ? { category: { parent: { legacyId, level: "MID" as const } } }
        : { category: { parent: { parent: { legacyId, level: "TOP" as const } } } };

  const rows = await prisma.product.findMany({
    where: { ...PUBLISHED, ...where },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    select: productSelect,
  });
  return rows.map((r) => toStoreProduct(r as Row));
}

export async function searchProducts(q: string): Promise<StoreProduct[]> {
  const term = q.trim();
  if (!term) return [];

  const rows = await prisma.product.findMany({
    where: {
      ...PUBLISHED,
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { shortDescription: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { category: { name: { contains: term, mode: "insensitive" } } },
      ],
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 60,
    select: productSelect,
  });
  return rows.map((r) => toStoreProduct(r as Row));
}

export async function getFeatured(take = 8): Promise<StoreProduct[]> {
  const rows = await prisma.product.findMany({
    where: { ...PUBLISHED, isFeatured: true },
    orderBy: { publishedAt: "desc" },
    take,
    select: productSelect,
  });
  // Nothing flagged yet is the normal state of a fresh catalogue, so fall back
  // to the newest rather than rendering an empty homepage rail.
  if (rows.length === 0) return getLatest(take);
  return rows.map((r) => toStoreProduct(r as Row));
}

export async function getLatest(take = 6): Promise<StoreProduct[]> {
  const rows = await prisma.product.findMany({
    where: PUBLISHED,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
    select: productSelect,
  });
  return rows.map((r) => toStoreProduct(r as Row));
}

/** No behavioural data exists yet, so "popular" is the rest of the catalogue. */
export async function getPopular(take = 8): Promise<StoreProduct[]> {
  const rows = await prisma.product.findMany({
    where: PUBLISHED,
    orderBy: [{ title: "asc" }],
    take,
    select: productSelect,
  });
  return rows.map((r) => toStoreProduct(r as Row));
}

/** Same category, excluding the product being viewed. */
export async function getRelated(slug: string, endLegacyId: number, take = 4): Promise<StoreProduct[]> {
  const rows = await prisma.product.findMany({
    where: { ...PUBLISHED, slug: { not: slug }, category: { legacyId: endLegacyId, level: "END" } },
    orderBy: { publishedAt: "desc" },
    take,
    select: productSelect,
  });
  return rows.map((r) => toStoreProduct(r as Row));
}

/** Slugs for the sitemap and for generateStaticParams. */
export async function getAllProductSlugs(): Promise<string[]> {
  const rows = await prisma.product.findMany({ where: PUBLISHED, select: { slug: true } });
  return rows.map((r) => r.slug);
}
