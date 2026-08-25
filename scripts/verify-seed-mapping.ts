/**
 * Offline check of the seed's mapping logic — no database required.
 *
 * The seed's real risk is not SQL, it is identity: the legacy catalogue has
 * names that repeat across branches and numeric ids that repeat across levels.
 * If slug generation collides, `prisma migrate` succeeds and the seed then dies
 * halfway through on a unique violation, leaving a half-imported catalogue.
 *
 * Run: npx tsx scripts/verify-seed-mapping.ts
 */
import { catalog } from "../src/data/catalog";
import { products } from "../src/data/products";
import { slugify } from "../src/lib/slug";
import { buildCategorySlugResolver } from "../src/lib/categoryTree";

let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.error(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
  }
}

console.log("\nCategory tree");

const slugFor = buildCategorySlugResolver(catalog);
const slugs: string[] = [];
const legacyPairs = new Set<string>();
let tops = 0;
let mids = 0;
let ends = 0;
const endIds = new Set<number>();

for (const top of catalog) {
  tops++;
  slugs.push(slugFor("TOP", top.name));
  legacyPairs.add(`TOP:${top.id}`);
  for (const mid of top.children) {
    mids++;
    slugs.push(slugFor("MID", mid.name, top.name));
    legacyPairs.add(`MID:${mid.id}`);
    for (const end of mid.children) {
      ends++;
      slugs.push(slugFor("END", end.name, mid.name));
      legacyPairs.add(`END:${end.id}`);
      endIds.add(end.id);
    }
  }
}

check(`tree shape is 3 top / 9 mid / 55 end`, tops === 3 && mids === 9 && ends === 55, `got ${tops}/${mids}/${ends}`);

const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
check(
  `all ${slugs.length} category slugs are unique (Category.slug is @unique)`,
  dupSlugs.length === 0,
  dupSlugs.length ? `duplicates: ${[...new Set(dupSlugs)].join(", ")}` : ""
);

check(
  `(legacyId, level) pairs are unique — the compound key products rely on`,
  legacyPairs.size === tops + mids + ends,
  `${legacyPairs.size} pairs for ${tops + mids + ends} nodes`
);

check(
  `no category slug is empty`,
  slugs.every((s) => s.length > 0)
);

console.log("\nProducts");

const productSlugs = new Set<string>();
const collisionsResolved: string[] = [];
const orphans: number[] = [];
const skus = new Set<string>();

for (const p of products) {
  if (!endIds.has(p.endId)) orphans.push(p.id);

  let slug = slugify(p.name) || `product-${p.id}`;
  if (productSlugs.has(slug)) {
    collisionsResolved.push(slug);
    slug = `${slug}-${p.id}`;
  }
  productSlugs.add(slug);
  skus.add(`ZF-${String(p.id).padStart(5, "0")}`);
}

check(
  `every product resolves to a real end category`,
  orphans.length === 0,
  orphans.length ? `orphaned product ids: ${orphans.join(", ")}` : ""
);
check(
  `all ${productSlugs.size} product slugs are unique`,
  productSlugs.size === products.length,
  `${products.length} products -> ${productSlugs.size} slugs`
);
check(`all ${skus.size} SKUs are unique`, skus.size === products.length);
check(
  `no product slug is empty`,
  [...productSlugs].every((s) => s.length > 0)
);

if (collisionsResolved.length) {
  console.log(`  note  ${collisionsResolved.length} title collision(s) resolved by id suffix: ${collisionsResolved.join(", ")}`);
}

console.log("\nSlug normalisation spot-checks");
const cases: [string, string][] = [
  ["Women's Professional Medical Scrub Top & Pants Set – Navy Blue", "womens-professional-medical-scrub-top-and-pants-set-navy-blue"],
  ["T-shirts & Shirts", "t-shirts-and-shirts"],
  ["Slippers & Casual Shoes", "slippers-and-casual-shoes"],
];
for (const [input, expected] of cases) {
  const actual = slugify(input);
  check(`slugify(${JSON.stringify(input.slice(0, 34))}…)`, actual === expected, `expected ${expected}\n        actual   ${actual}`);
}

console.log(
  failures === 0
    ? "\nAll seed-mapping checks passed.\n"
    : `\n${failures} check(s) FAILED.\n`
);
process.exit(failures === 0 ? 0 : 1);
