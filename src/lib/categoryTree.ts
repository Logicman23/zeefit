import { slugify } from "./slug";
import type { TopCategory } from "@/data/catalog";

export type Level = "TOP" | "MID" | "END";

/**
 * Category names repeat across branches of the zeefit tree — "Watches",
 * "Sunglasses", "Tops", "Sandals", "Boots", "Sports Shoes", "Multipacks" and
 * "Other Accessories" all appear under both Men and Women.
 *
 * Resolving those collisions by insertion order would make a category's slug —
 * and therefore its URL — depend on the order rows happened to be written. So
 * instead: a name that is ambiguous at its own level is ALWAYS prefixed with its
 * parent, and a name that is unique never is. The result is stable no matter how
 * or when the seed runs.
 */
export function buildCategorySlugResolver(tree: TopCategory[]) {
  const occurrences = new Map<string, number>();
  const key = (level: Level, name: string) => `${level}:${slugify(name)}`;

  const bump = (level: Level, name: string) =>
    occurrences.set(key(level, name), (occurrences.get(key(level, name)) ?? 0) + 1);

  for (const top of tree) {
    bump("TOP", top.name);
    for (const mid of top.children) {
      bump("MID", mid.name);
      for (const end of mid.children) bump("END", end.name);
    }
  }

  return function slugFor(level: Level, name: string, parentName?: string): string {
    const base = slugify(name);
    const ambiguous = (occurrences.get(key(level, name)) ?? 0) > 1;
    return ambiguous && parentName ? `${slugify(parentName)}-${base}` : base;
  };
}
