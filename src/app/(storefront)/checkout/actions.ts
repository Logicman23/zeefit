"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  checkoutSchema,
  cartPayloadSchema,
  checkoutFieldErrors,
  normalisePhone,
} from "@/lib/validation/order";

export type PlaceOrderState = {
  ok?: boolean;
  reference?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Lines the server refused, so the cart page can explain what changed. */
  rejected?: { slug: string; reason: string }[];
};

/** ZF-YYMM-XXXXXX. Short enough to read down a phone, unique enough not to clash. */
function makeReference() {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const suffix = randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `ZF-${stamp}-${suffix}`;
}

/**
 * Places a cash-on-delivery order.
 *
 * The browser sends slugs and quantities only. Every price, name and stock level
 * is re-read from the database here — a cart lives in localStorage, where anyone
 * can edit it, so a client-supplied price is an offer to pay whatever the
 * customer fancies. Nothing about money crosses the boundary as input.
 */
export async function placeOrder(
  _prev: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const details = checkoutSchema.safeParse(Object.fromEntries(formData));

  let lines;
  try {
    lines = cartPayloadSchema.parse(JSON.parse(String(formData.get("cart") ?? "[]")));
  } catch {
    return { error: "Your cart could not be read. Please reload the page and try again." };
  }

  if (!details.success) return { fieldErrors: checkoutFieldErrors(details.error) };

  // Re-read the catalogue. Published only: a draft or archived product must not
  // become sellable just because it was in someone's cart when it was pulled.
  const products = await prisma.product.findMany({
    where: { slug: { in: lines.map((l) => l.slug) }, status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      sku: true,
      price: true,
      primaryImage: true,
      stock: true,
      trackInventory: true,
    },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const rejected: { slug: string; reason: string }[] = [];
  const items: {
    productId: string;
    titleSnapshot: string;
    slugSnapshot: string;
    skuSnapshot: string;
    imageSnapshot: string;
    unitPrice: number;
    qty: number;
    size: string;
    color: string;
    lineTotal: number;
    trackInventory: boolean;
  }[] = [];

  for (const line of lines) {
    const p = bySlug.get(line.slug);
    if (!p) {
      rejected.push({ slug: line.slug, reason: "no longer available" });
      continue;
    }
    if (p.trackInventory && p.stock < line.qty) {
      rejected.push({
        slug: line.slug,
        reason: p.stock === 0 ? "out of stock" : `only ${p.stock} left`,
      });
      continue;
    }

    const unitPrice = Number(p.price);
    items.push({
      productId: p.id,
      titleSnapshot: p.title,
      slugSnapshot: p.slug,
      skuSnapshot: p.sku,
      imageSnapshot: p.primaryImage,
      unitPrice,
      qty: line.qty,
      size: line.size,
      color: line.color,
      lineTotal: Math.round(unitPrice * line.qty * 100) / 100,
      trackInventory: p.trackInventory,
    });
  }

  if (rejected.length > 0) {
    return {
      rejected,
      error:
        "Some items are no longer available at the quantity you asked for. Please review your cart.",
    };
  }
  if (items.length === 0) return { error: "Your cart is empty." };

  const subtotal = Math.round(items.reduce((n, i) => n + i.lineTotal, 0) * 100) / 100;
  const shipping = 0; // Free inside the UAE, as the storefront states.
  const h = await headers();

  const reference = makeReference();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          reference,
          status: "PENDING",
          paymentMethod: "COD",
          customerName: details.data.customerName,
          customerEmail: details.data.customerEmail,
          customerPhone: normalisePhone(details.data.customerPhone),
          addressLine1: details.data.addressLine1,
          addressLine2: details.data.addressLine2,
          city: details.data.city,
          emirate: details.data.emirate,
          notes: details.data.notes,
          subtotal,
          shipping,
          total: subtotal + shipping,
          ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
          userAgent: h.get("user-agent"),
          items: {
            create: items.map(({ trackInventory: _t, ...i }) => i),
          },
        },
      });

      // Decrement inside the same transaction, with the stock guard repeated in
      // the WHERE clause. Two shoppers taking the last unit at the same moment
      // both passed the check above; only one can satisfy this update.
      for (const i of items) {
        if (!i.trackInventory) continue;
        const updated = await tx.product.updateMany({
          where: { id: i.productId, stock: { gte: i.qty } },
          data: { stock: { decrement: i.qty } },
        });
        if (updated.count === 0) {
          throw new Error(`INSUFFICIENT_STOCK:${i.slugSnapshot}`);
        }
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      return {
        error: "Someone bought the last one while you were checking out. Please review your cart.",
        rejected: [{ slug: message.split(":")[1], reason: "just sold out" }],
      };
    }
    console.error("placeOrder failed", e);
    return { error: "We could not place your order. Please try again." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, reference };
}
