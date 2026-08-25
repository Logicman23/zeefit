import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import SectionHead from "@/components/SectionHead";
import { byId, products } from "@/data/products";
import { catalog, categoryHref } from "@/data/catalog";

type Params = { searchParams: Promise<{ id?: string }> };

export async function generateMetadata({ searchParams }: Params) {
  const sp = await searchParams;
  const p = byId(Number(sp.id));
  return { title: p ? p.name : "ZEE FIT " };
}

/** Rebuilds the original breadcrumb: Home > Top > Mid > End > Product Name */
function crumbs(topId: number, midId: number, endId: number) {
  const top = catalog.find((t) => t.id === topId);
  const mid = top?.children.find((m) => m.id === midId);
  const end = mid?.children.find((e) => e.id === endId);
  return [
    top && { label: top.name, href: categoryHref(top.id, "top-category") },
    mid && { label: mid.name, href: categoryHref(mid.id, "mid-category") },
    end && { label: end.name, href: categoryHref(end.id, "end-category") },
  ].filter(Boolean) as { label: string; href: string }[];
}

export default async function ProductPage({ searchParams }: Params) {
  const sp = await searchParams;
  const product = byId(Number(sp.id));
  if (!product) notFound();

  const trail = crumbs(product.topId, product.midId, product.endId);
  const related = products.filter((p) => p.midId === product.midId && p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-[1400px] px-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 border-b border-line py-6 text-[0.75rem] text-ink-muted">
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
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
