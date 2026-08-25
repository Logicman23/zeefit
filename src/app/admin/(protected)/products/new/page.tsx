import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { getCategoryOptions } from "@/lib/categories";
import ProductForm, { EMPTY_PRODUCT } from "@/components/admin/ProductForm";
import { getSetting } from "@/lib/settings";
import { createProduct } from "../actions";

export const metadata: Metadata = {
  title: "Add product — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  // Gate first, query second — no work happens for someone who cannot be here.
  const staff = await requirePermission("product:create");
  const [categories, lowStockAt] = await Promise.all([
    getCategoryOptions(),
    getSetting<number>("commerce.lowStockThreshold"),
  ]);

  return (
    <ProductForm
      mode="create"
      defaults={{ ...EMPTY_PRODUCT, lowStockThreshold: String(lowStockAt) }}
      action={createProduct}
      categories={categories}
      canPublish={can(staff.role, "product:publish")}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "https://zeefit.ae"}
    />
  );
}
