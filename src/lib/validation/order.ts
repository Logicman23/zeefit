import { z } from "zod";

/** The seven emirates, so the address is structured rather than free text. */
export const EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

/**
 * UAE mobile numbers, accepting the forms people actually type:
 * 0501234567, 971501234567, +971 50 123 4567.
 */
const UAE_PHONE = /^(?:\+?971|0)?5[0-9]{8}$/;

export function normalisePhone(input: string) {
  const digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const national = digits.replace(/^971/, "").replace(/^0/, "");
  return `+971${national}`;
}

const optional = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable().default(null)
  );

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name").max(120),
  customerPhone: z
    .string()
    .trim()
    .transform((s) => s.replace(/\s+/g, ""))
    .refine((s) => UAE_PHONE.test(s), "Enter a UAE mobile number, e.g. 050 123 4567"),
  customerEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.email("Enter a valid email address").nullable().default(null)
  ),
  addressLine1: z.string().trim().min(4, "Enter your address").max(160),
  addressLine2: optional(160),
  city: z.string().trim().min(2, "Enter your city or area").max(80),
  emirate: z.enum(EMIRATES, { message: "Choose an emirate" }),
  notes: optional(500),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** What the browser sends. Prices are NOT taken from here — see placeOrder. */
export const cartLineSchema = z.object({
  slug: z.string().min(1),
  size: z.string().default(""),
  color: z.string().default(""),
  qty: z.number().int().min(1).max(99),
});

export const cartPayloadSchema = z.array(cartLineSchema).min(1, "Your cart is empty").max(50);

export function checkoutFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
