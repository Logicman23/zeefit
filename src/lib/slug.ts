/**
 * Slug rules for product and category URLs.
 *
 * The live catalogue is full of typographic apostrophes and en dashes
 * ("Women’s Professional Medical Scrub Top & Pants Set – Navy Blue"), so
 * normalisation strips diacritics and folds every punctuation run to a single
 * hyphen rather than percent-encoding it into the URL.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents
    .replace(/[‘’'`]/g, "") // apostrophes vanish: women's -> womens
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
    .replace(/-+$/g, "");
}

/**
 * Appends -2, -3 … until the slug is free. `taken` is the set of slugs already
 * in play; the caller supplies it from a single indexed query rather than
 * round-tripping per candidate.
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = slugify(base) || "item";
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

/** Derives a starting SKU from a title, e.g. "ZF-WOMENS-SCRUB-A1B2". */
export function suggestSku(title: string, seed: string): string {
  const stem = slugify(title).split("-").slice(0, 3).join("-").toUpperCase() || "ITEM";
  return `ZF-${stem}-${seed.slice(0, 4).toUpperCase()}`;
}
