import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { getCategoryOptions } from "@/lib/categories";
import ProductForm from "@/components/admin/ProductForm";
import { createProduct } from "../actions";

export const metadata: Metadata = {
  title: "Add product — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  // Gate first, query second — no work happens for someone who cannot be here.
  const staff = await requirePermission("product:create");
  const categories = await getCategoryOptions();

  return (
    <ProductForm
      mode="create"
      action={createProduct}
      categories={categories}
      canPublish={can(staff.role, "product:publish")}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "https://zeefit.ae"}
    />
  );
}
