/** Original site rendered prices as a bare "AED180". Kept, but formatted consistently. */
export function aed(value: number): string {
  return `AED${value.toLocaleString("en-AE")}`;
}

export function discountPct(price: number, oldPrice: number | null): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}
