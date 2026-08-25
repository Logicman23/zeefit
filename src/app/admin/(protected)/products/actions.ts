"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { ProductStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth/guard";
import { productSchema, fieldErrors } from "@/lib/validation/product";

export type ProductActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

/** Turns Postgres unique-violations into a message beside the offending input. */
function uniqueViolation(e: unknown): Record<string, string> | null {
  const err = e as { code?: string; meta?: { target?: string[] | string } };
  if (err?.code !== "P2002") return null;
  const target = Array.isArray(err.meta?.target) ? err.meta.target.join(",") : String(err.meta?.target ?? "");
  if (target.includes("slug")) return { slug: "That slug is already in use — try another." };
  if (target.includes("sku")) return { sku: "That SKU already exists." };
  return { _form: "A product with those details already exists." };
}

function parse(formData: FormData) {
  return productSchema.safeParse(Object.fromEntries(formData));
}

/**
 * Maps validated input onto the Prisma payload. `publishedAt` is stamped on the
 * first transition into PUBLISHED and never overwritten afterwards, so the
 * storefront's "newest first" ordering is not reshuffled by later edits.
 */
function toPayload(
  input: ReturnType<typeof productSchema.parse>,
  existing?: { status: ProductStatus; publishedAt: Date | null }
) {
  const becomingLive = input.status === "PUBLISHED";
  const alreadyStamped = existing?.publishedAt ?? null;

  return {
    title: input.title,
    slug: input.slug,
    sku: input.sku,
    shortDescription: input.shortDescription,
    description: input.description,
    features: input.features,
    conditions: input.conditions,
    returnPolicy: input.returnPolicy,
    // Prisma accepts number|string|Decimal for a Decimal column; passing the
    // parsed number keeps this file free of a runtime Prisma import.
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    costPrice: input.costPrice,
    stock: input.stock,
    lowStockThreshold: input.lowStockThreshold,
    trackInventory: input.trackInventory,
    weightGrams: input.weightGrams,
    categoryId: input.categoryId,
    primaryImage: input.primaryImage,
    gallery: input.gallery,
    sizes: input.sizes,
    colors: input.colors,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    seoKeywords: input.seoKeywords,
    canonicalUrl: input.canonicalUrl,
    noIndex: input.noIndex,
    status: input.status,
    isFeatured: input.isFeatured,
    publishedAt: becomingLive ? alreadyStamped ?? new Date() : alreadyStamped,
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const auth = await authorize("product:create");
  if (!auth.ok) return { error: auth.error };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // Publishing is a separate permission from creating, even though Editors
  // currently hold both — so the check does not silently disappear if the
  // matrix is ever tightened.
  if (parsed.data.status === "PUBLISHED") {
    const pub = await authorize("product:publish");
    if (!pub.ok) return { fieldErrors: { status: pub.error } };
  }

  let newId: string;
  try {
    const meta = await requestMeta();
    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data: toPayload(parsed.data) });
      await tx.auditLog.create({
        data: {
          actorId: auth.staff.id,
          actorEmail: auth.staff.email,
          actorRole: auth.staff.role,
          action: parsed.data.status === "PUBLISHED" ? "PUBLISH" : "CREATE",
          entity: "Product",
          entityId: product.id,
          summary: `Created "${product.title}" as ${product.status}`,
          ...meta,
        },
      });
      return product;
    });
    newId = created.id;
  } catch (e) {
    const conflict = uniqueViolation(e);
    if (conflict) return { fieldErrors: conflict };
    console.error("createProduct failed", e);
    return { error: "Could not save the product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  // redirect() throws a control-flow signal — it must sit outside the try block
  // or the catch above would swallow it and report a save failure.
  redirect(`/admin/products/${newId}?saved=1`);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateProduct(
  id: string,
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const auth = await authorize("product:update");
  if (!auth.ok) return { error: auth.error };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, title: true, status: true, publishedAt: true, deletedAt: true },
  });
  if (!existing || existing.deletedAt) return { error: "That product no longer exists." };

  if (parsed.data.status !== existing.status && parsed.data.status === "PUBLISHED") {
    const pub = await authorize("product:publish");
    if (!pub.ok) return { fieldErrors: { status: pub.error } };
  }
  if (parsed.data.status === "ARCHIVED" && existing.status !== "ARCHIVED") {
    const arch = await authorize("product:archive");
    if (!arch.ok) return { fieldErrors: { status: arch.error } };
  }

  try {
    const meta = await requestMeta();
    await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: toPayload(parsed.data, existing),
      });
      await tx.auditLog.create({
        data: {
          actorId: auth.staff.id,
          actorEmail: auth.staff.email,
          actorRole: auth.staff.role,
          action:
            existing.status === updated.status
              ? "UPDATE"
              : updated.status === "PUBLISHED"
                ? "PUBLISH"
                : updated.status === "ARCHIVED"
                  ? "ARCHIVE"
                  : "UNPUBLISH",
          entity: "Product",
          entityId: updated.id,
          summary: `Updated "${updated.title}"`,
          diff:
            existing.status === updated.status
              ? undefined
              : { status: { from: existing.status, to: updated.status } },
          ...meta,
        },
      });
    });
  } catch (e) {
    const conflict = uniqueViolation(e);
    if (conflict) return { fieldErrors: conflict };
    console.error("updateProduct failed", e);
    return { error: "Could not save your changes. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Quick status change (row actions on the product table)
// ---------------------------------------------------------------------------

export async function setProductStatus(id: string, status: ProductStatus) {
  const permission =
    status === "PUBLISHED" ? "product:publish" : status === "ARCHIVED" ? "product:archive" : "product:update";

  const auth = await authorize(permission);
  if (!auth.ok) return { error: auth.error };

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { title: true, status: true, publishedAt: true, deletedAt: true },
  });
  if (!existing || existing.deletedAt) return { error: "That product no longer exists." };

  const meta = await requestMeta();
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        status,
        publishedAt:
          status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: auth.staff.id,
        actorEmail: auth.staff.email,
        actorRole: auth.staff.role,
        action: status === "PUBLISHED" ? "PUBLISH" : status === "ARCHIVED" ? "ARCHIVE" : "UNPUBLISH",
        entity: "Product",
        entityId: id,
        summary: `"${existing.title}" moved to ${status}`,
        diff: { status: { from: existing.status, to: status } },
        ...meta,
      },
    });
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Delete — ADMIN only
// ---------------------------------------------------------------------------

/**
 * Soft delete. The row stays put so audit history and any future order lines
 * keep resolving; the slug stays taken so a new product cannot silently inherit
 * a dead product's search history.
 */
export async function deleteProduct(id: string) {
  const auth = await authorize("product:delete");
  if (!auth.ok) return { error: auth.error };

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { title: true, deletedAt: true },
  });
  if (!existing || existing.deletedAt) return { error: "That product no longer exists." };

  const meta = await requestMeta();
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });
    await tx.auditLog.create({
      data: {
        actorId: auth.staff.id,
        actorEmail: auth.staff.email,
        actorRole: auth.staff.role,
        action: "DELETE",
        entity: "Product",
        entityId: id,
        summary: `Deleted "${existing.title}"`,
        ...meta,
      },
    });
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  return { ok: true };
}
