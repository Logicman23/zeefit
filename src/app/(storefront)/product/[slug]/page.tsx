import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import SectionHead from "@/components/SectionHead";
import { categoryHref } from "@/data/catalog";
import { getProductBySlug, getRelated, getCatalog, type TopCategory } from "@/lib/storefront";

type Params = { params: Promise<{ slug: string }> };

/**
 * Canonical product URL. Every product has a slug, including ones created in the
 * admin panel, which is why this replaced the old /product?id=<number> route —
 * that one could only ever address the products imported from the legacy site.
 */

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "ZEE FIT" };

  return {
    title: p.name,
    description: p.short || undefined,
    openGraph: {
      title: p.name,
      description: p.short || undefined,
      images: p.image ? [p.image] : undefined,
      type: "website",
    },
  };
}

/** Home > Top > Mid > End > Product Name, as the original site rendered it. */
function crumbs(catalog: TopCategory[], topId: number, midId: number, endId: number) {
  const top = catalog.find((t) => t.id === topId);
  const mid = top?.children.find((m) => m.id === midId);
  const end = mid?.children.find((e) => e.id === endId);
  return [
    top && { label: top.name, href: categoryHref(top.id, "top-category") },
    mid && { label: mid.name, href: categoryHref(mid.id, "mid-category") },
    end && { label: end.name, href: categoryHref(end.id, "end-category") },
  ].filter(Boolean) as { label: string; href: string }[];
}

/**
 * Cached and re-rendered at most once a minute. Publishing from the admin
 * panel purges this immediately, so an edit does not wait out the window.
 */
export const revalidate = 60;

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  // A draft, archived or soft-deleted product is a 404 to the public, not a
  // "you may not see this" — its existence is not disclosed.
  if (!product) notFound();

  const [catalog, related] = await Promise.all([
    getCatalog(),
    getRelated(product.slug, product.endId),
  ]);
  const trail = crumbs(catalog, product.topId, product.midId, product.endId);

  return (
    <div className="mx-auto max-w-[1400px] px-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 border-b border-line py-6 text-[0.75rem] text-ink-muted"
      >
        <Link href="/" className="transition-colors hover:text-brand">
          Home
        </Link>
        {trail.map((c) => (
          <span key={c.href} className="flex items-center gap-2">
            <span className="text-line-strong" aria-hidden>
              /
            </span>
            <Link href={c.href} className="transition-colors hover:text-brand">
              {c.label}
            </Link>
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span className="text-line-strong" aria-hidden>
            /
          </span>
          <span className="text-ink">{product.name}</span>
        </span>
      </nav>

      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="border-t border-line py-14 lg:py-20">
          <SectionHead title="You May Also Like" sub="More from this collection" />
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
