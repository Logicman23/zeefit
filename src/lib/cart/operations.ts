/**
 * Pure cart maths, kept out of the React provider so it can be reasoned about
 * and tested without a browser. The provider is then just state plus storage.
 */

export type CartLine = {
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  qty: number;
};

export const MAX_QTY = 99;

/**
 * A line is product + size + colour. The same shirt in M and L are two lines,
 * not one line of two — they are different things to pick, pack and ship.
 */
export function lineKey(l: Pick<CartLine, "slug" | "size" | "color">) {
  return `${l.slug}::${l.size}::${l.color}`;
}

export function addLine(lines: CartLine[], line: Omit<CartLine, "qty">, qty = 1): CartLine[] {
  const key = lineKey(line);
  const wanted = Math.min(MAX_QTY, Math.max(1, Math.floor(qty)));

  if (lines.some((l) => lineKey(l) === key)) {
    return lines.map((l) =>
      lineKey(l) === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + wanted) } : l
    );
  }
  return [...lines, { ...line, qty: wanted }];
}

/** Zero or less removes the line — the quantity stepper doubles as a delete. */
export function setLineQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  const next = Math.floor(qty);
  if (next <= 0) return lines.filter((l) => lineKey(l) !== key);
  return lines.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(MAX_QTY, next) } : l));
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((l) => lineKey(l) !== key);
}

export function totals(lines: CartLine[]) {
  return {
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((n, l) => n + l.price * l.qty, 0),
  };
}

/** Guards against a corrupted or hand-edited localStorage payload. */
export function isLine(v: unknown): v is CartLine {
  if (!v || typeof v !== "object") return false;
  const l = v as Record<string, unknown>;
  return (
    typeof l.slug === "string" &&
    l.slug.length > 0 &&
    typeof l.name === "string" &&
    typeof l.price === "number" &&
    Number.isFinite(l.price) &&
    l.price >= 0 &&
    typeof l.qty === "number" &&
    Number.isFinite(l.qty) &&
    l.qty > 0
  );
}
