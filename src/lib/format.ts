/**
 * Original site rendered prices as a bare "AED180". Kept, but formatted consistently.
 * Formatted without Intl/toLocaleString so output is identical at build time and at
 * request time regardless of the serverless runtime's ICU data.
 */
export function aed(value: number): string {
  const whole = Math.round(value * 100) / 100;
  const [int, frac] = String(whole).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `AED${frac ? `${grouped}.${frac}` : grouped}`;
}

export function discountPct(price: number, oldPrice: number | null): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}
