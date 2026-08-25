import { z } from "zod";

/**
 * SERP truncation points. Google renders ~600px, not a character count, but 60
 * and 160 are the conventional safe ceilings and they match the VarChar limits
 * in schema.prisma. Validating here first means the editor sees a counter and a
 * field-level message instead of a Postgres 22001 error at insert time.
 */
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** FormData gives "on" for a ticked checkbox and nothing at all for an unticked one. */
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

/** "" from an untouched optional input should be null, not an empty string. */
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().nullable().default(null)
);

/** "S, M, L" -> ["S","M","L"], de-duplicated, blanks dropped. */
const csvList = z.preprocess((v) => {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return [];
  return [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))];
}, z.array(z.string().min(1)).default([]));

const money = z.coerce
  .number({ message: "Enter a valid amount" })
  .min(0, "Cannot be negative")
  .max(9_999_999.99, "Too large")
  .refine((n) => Number.isFinite(n), "Enter a valid amount")
  .refine((n) => Math.round(n * 100) === n * 100, "Maximum 2 decimal places");

const optionalMoney = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  money.nullable().default(null)
);

export const productSchema = z
  .object({
    // --- Basic info ---
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(160),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(96)
      .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens only"),
    sku: z.string().trim().min(2, "SKU is required").max(64),
    categoryId: z.string().min(1, "Choose a category"),

    // --- Rich text (HTML from the editor) ---
    shortDescription: optionalText,
    description: optionalText,
    features: optionalText,
    conditions: optionalText,
    returnPolicy: optionalText,

    // --- Pricing & inventory ---
    price: money,
    compareAtPrice: optionalMoney,
    costPrice: optionalMoney,
    stock: z.coerce.number().int("Whole units only").min(0, "Cannot be negative").max(1_000_000),
    lowStockThreshold: z.coerce.number().int().min(0).max(10_000).default(5),
    trackInventory: checkbox.default(true),
    weightGrams: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.coerce.number().int().min(0).nullable().default(null)
    ),

    // --- Media & options ---
    primaryImage: z.string().trim().default(""),
    gallery: csvList,
    sizes: csvList,
    colors: csvList,

    // --- SEO ---
    seoTitle: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.string().trim().max(SEO_TITLE_MAX, `Keep to ${SEO_TITLE_MAX} characters or fewer`).nullable().default(null)
    ),
    seoDescription: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z
        .string()
        .trim()
        .max(SEO_DESCRIPTION_MAX, `Keep to ${SEO_DESCRIPTION_MAX} characters or fewer`)
        .nullable()
        .default(null)
    ),
    seoKeywords: csvList,
    canonicalUrl: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.url("Enter a full URL including https://").nullable().default(null)
    ),
    noIndex: checkbox.default(false),

    // --- Lifecycle ---
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    isFeatured: checkbox.default(false),
  })
  .refine((d) => d.compareAtPrice === null || d.compareAtPrice > d.price, {
    path: ["compareAtPrice"],
    message: "The compare-at price must be higher than the selling price, or left blank",
  })
  .refine((d) => d.status !== "PUBLISHED" || d.primaryImage.length > 0, {
    path: ["primaryImage"],
    message: "A published product needs a primary image",
  })
  .refine((d) => d.status !== "PUBLISHED" || (d.description?.length ?? 0) > 0, {
    path: ["description"],
    message: "A published product needs a description",
  });

export type ProductInput = z.infer<typeof productSchema>;

/** Flattens Zod issues into { field: message } for rendering beside each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
