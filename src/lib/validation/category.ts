import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().nullable().default(null)
);

export const categorySchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(96)
      .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens only"),
    level: z.enum(["TOP", "MID", "END"]),
    parentId: optionalText,
    description: optionalText,
    imageUrl: optionalText,
    position: z.coerce.number().int().min(0).max(9999).default(0),
    isActive: checkbox.default(true),
    seoTitle: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.string().trim().max(60, "Keep to 60 characters or fewer").nullable().default(null)
    ),
    seoDescription: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.string().trim().max(160, "Keep to 160 characters or fewer").nullable().default(null)
    ),
  })
  /**
   * Only a TOP category may be parentless. The tree's shape is what keeps
   * /product-category?id=..&type=..-category resolving, so a MID or END floating
   * without a parent would be unreachable from the site's navigation.
   */
  .refine((d) => d.level === "TOP" || d.parentId !== null, {
    path: ["parentId"],
    message: "Choose a parent category",
  })
  .refine((d) => d.level !== "TOP" || d.parentId === null, {
    path: ["parentId"],
    message: "A top-level category cannot have a parent",
  });

export type CategoryInput = z.infer<typeof categorySchema>;

/** The level a parent must be, for a child at the given level. */
export const PARENT_LEVEL = { TOP: null, MID: "TOP", END: "MID" } as const;

export const LEVEL_LABEL = {
  TOP: "Top level",
  MID: "Sub-category",
  END: "Product category",
} as const;

export function categoryFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
