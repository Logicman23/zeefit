import { notFound, permanentRedirect } from "next/navigation";
import { getProductByLegacyId } from "@/lib/storefront";

type Params = { searchParams: Promise<{ id?: string }> };

/**
 * The original site addressed products as /product?id=83, and those URLs are
 * indexed and linked to from elsewhere. They keep working, but as a permanent
 * redirect to the canonical slug rather than a second address serving the same
 * page — two live URLs for one product splits its search ranking between them.
 *
 * 308 rather than 302 so search engines transfer the ranking and stop asking.
 */
export default async function LegacyProductPage({ searchParams }: Params) {
  const { id } = await searchParams;
  const product = await getProductByLegacyId(Number(id));
  if (!product) notFound();

  permanentRedirect(`/product/${product.slug}`);
}
