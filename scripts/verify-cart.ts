/**
 * Cart behaviour, checked without a browser.
 * Run: npx tsx scripts/verify-cart.ts
 */
import { addLine, setLineQty, removeLine, totals, isLine, lineKey, MAX_QTY, type CartLine } from "../src/lib/cart/operations";

let fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) console.log(`  PASS  ${label}`);
  else { fail++; console.error(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`); }
}

const shirt = { slug: "z-active-tee", name: "Z-Active Tee", price: 120, image: "/a.jpg", size: "M", color: "Grey" };
const shirtL = { ...shirt, size: "L" };

console.log("\nAdding");
let c: CartLine[] = [];
c = addLine(c, shirt);
check("adding once creates one line of qty 1", c.length === 1 && c[0].qty === 1);

c = addLine(c, shirt, 2);
check("adding the same size merges quantity", c.length === 1 && c[0].qty === 3, JSON.stringify(c));

c = addLine(c, shirtL);
check("a different size is a separate line", c.length === 2, JSON.stringify(c.map((l) => l.size)));

check("subtotal counts every line", totals(c).subtotal === 120 * 3 + 120, String(totals(c).subtotal));
check("count sums quantities, not lines", totals(c).count === 4, String(totals(c).count));

console.log("\nQuantities");
const key = lineKey(shirt);
check("setting a quantity replaces it", setLineQty(c, key, 5).find((l) => lineKey(l) === key)?.qty === 5);
check("zero removes the line", setLineQty(c, key, 0).length === 1);
check("negative removes the line", setLineQty(c, key, -3).length === 1);
check("quantity is capped", addLine(c, shirt, 999).find((l) => lineKey(l) === key)!.qty === MAX_QTY);
check("fractional quantities are floored", addLine([], shirt, 2.9)[0].qty === 2);
check("zero on add still adds one", addLine([], shirt, 0)[0].qty === 1);

console.log("\nRemoval");
check("remove drops only the matching line", removeLine(c, key).length === 1);
check("removing an unknown key is a no-op", removeLine(c, "nope").length === 2);

console.log("\nStored payload validation");
check("rejects a missing slug", !isLine({ name: "x", price: 1, qty: 1 }));
check("rejects a negative price", !isLine({ ...shirt, price: -5, qty: 1 }));
check("rejects zero quantity", !isLine({ ...shirt, qty: 0 }));
check("rejects NaN price", !isLine({ ...shirt, price: NaN, qty: 1 }));
check("accepts a well-formed line", isLine({ ...shirt, qty: 2 }));
check("a corrupt array filters down to valid lines", [{ ...shirt, qty: 1 }, null, { junk: true }].filter(isLine).length === 1);

console.log(fail ? `\n${fail} check(s) FAILED.\n` : "\nAll cart checks passed.\n");
process.exit(fail ? 1 : 0);
