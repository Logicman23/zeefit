import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { getCategoryOptions } from "@/lib/categories";
import ProductForm, { type ProductDefaults } from "@/components/admin/ProductForm";
import { updateProduct } from "../actions";

export const metadata: Metadata = {
  title: "Edit product — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await requirePermission("product:update");

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    getCategoryOptions(),
  ]);

  // A soft-deleted product is gone as far as the editor is concerned.
  if (!product || product.deletedAt) notFound();

  // Decimal does not serialise across the Server/Client boundary, and neither
  // do arrays-as-arrays for these comma-separated inputs — both are flattened
  // to strings here, at the boundary, rather than inside the client component.
  const defaults: ProductDefaults = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    sku: product.sku,
    categoryId: product.categoryId,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    features: product.features ?? "",
    conditions: product.conditions ?? "",
    returnPolicy: product.returnPolicy ?? "",
    price: String(product.price),
    compareAtPrice: product.compareAtPrice === null ? "" : String(product.compareAtPrice),
    costPrice: product.costPrice === null ? "" : String(product.costPrice),
    stock: String(product.stock),
    lowStockThreshold: String(product.lowStockThreshold),
    trackInventory: product.trackInventory,
    weightGrams: product.weightGrams === null ? "" : String(product.weightGrams),
    primaryImage: product.primaryImage,
    gallery: product.gallery.join(", "),
    sizes: product.sizes.join(", "),
    colors: product.colors.join(", "),
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    seoKeywords: product.seoKeywords.join(", "),
    canonicalUrl: product.canonicalUrl ?? "",
    noIndex: product.noIndex,
    status: product.status,
    isFeatured: product.isFeatured,
  };

  return (
    <ProductForm
      mode="edit"
      action={updateProduct.bind(null, product.id)}
      categories={categories}
      defaults={defaults}
      canPublish={can(staff.role, "product:publish")}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "https://zeefit.ae"}
    />
  );
}
