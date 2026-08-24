import Link from "next/link";
import CategorySidebar from "@/components/CategorySidebar";
import ProductCard from "@/components/ProductCard";
import { findCategory } from "@/data/catalog";
import { productsInCategory } from "@/data/products";

type Params = { searchParams: Promise<{ id?: string; type?: string }> };

export async function generateMetadata({ searchParams }: Params) {
  const sp = await searchParams;
  const cat = findCategory(Number(sp.id), sp.type ?? "");
  return { title: cat ? `Category: ${cat.name}` : "ZEE FIT " };
}

export default async function CategoryPage({ searchParams }: Params) {
  const sp = await searchParams;
  const id = Number(sp.id);
  const type = sp.type ?? "top-category";
  const cat = findCategory(id, type);
  const items = cat ? productsInCategory(id, type) : [];

  return (
    <div className="mx-auto max-w-[1400px] px-6">
      {/* Page masthead */}
      <div className="border-b border-line py-10 lg:py-14">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[0.75rem] text-ink-muted">
          <Link href="/" className="transition-colors hover:text-brand">
            Home
          </Link>
          {cat?.trail.map((t, i) => (
            <span key={t + i} className="flex items-center gap-2">
              <span className="text-line-strong" aria-hidden>
                /
              </span>
              <span className={i === cat.trail.length - 1 ? "text-ink" : ""}>{t}</span>
            </span>
          ))}
        </nav>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-3xl text-ink sm:text-4xl lg:text-[3rem]">
            {cat ? `Category: ${cat.name}` : "Category"}
          </h1>
          <p className="text-[0.8125rem] text-ink-muted">
            {items.length} {items.length === 1 ? "product" : "products"}
          </p>
        </div>
      </div>

      <div className="grid gap-12 py-12 lg:grid-cols-[16rem_1fr] lg:gap-16 lg:py-16">
        <aside className="order-2 lg:order-1">
          <CategorySidebar activeId={id} activeType={type} />
        </aside>

        <div className="order-1 lg:order-2">
          <h2 className="rule-tick pt-6 font-display text-lg font-semibold tracking-tight text-ink">
            {cat ? `All Products Under "${cat.name}"` : "All Products"}
          </h2>

          {items.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 lg:gap-x-8">
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-dashed border-line-strong bg-mist px-8 py-20 text-center">
              <svg
                viewBox="0 0 24 24"
                className="mx-auto h-8 w-8 text-line-strong"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden
              >
                <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
                <path d="M3 7l9 4 9-4M12 11v10" />
              </svg>
              <p className="mt-5 font-display text-base font-semibold tracking-tight text-ink">No Product Found</p>
              <p className="mx-auto mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-ink-muted">
                This category has no products listed yet. Browse a neighbouring category from the index.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2.5 border border-line bg-paper px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-paper"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
