import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { searchProducts } from "@/lib/storefront";

type Params = { searchParams: Promise<{ search_text?: string }> };

export const metadata = { title: "Search Result" };

/**
 * Cached and re-rendered at most once a minute. Publishing from the admin
 * panel purges this immediately, so an edit does not wait out the window.
 */
export const revalidate = 60;

export default async function SearchResultPage({ searchParams }: Params) {
  const sp = await searchParams;
  const q = sp.search_text ?? "";
  const results = await searchProducts(q);

  return (
    <div className="mx-auto max-w-[1400px] px-6">
      <div className="border-b border-line py-10 lg:py-14">
        <span className="eyebrow text-brand">Search For:</span>
        <h1 className="display mt-4 text-3xl text-ink sm:text-4xl lg:text-[3rem]">{q}</h1>
        <p className="mt-4 text-[0.8125rem] text-ink-muted">
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 py-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:py-16">
          {results.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="my-12 border border-dashed border-line-strong bg-mist px-8 py-24 text-center lg:my-16">
          <svg
            viewBox="0 0 24 24"
            className="mx-auto h-8 w-8 text-line-strong"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden
          >
            <circle cx="10.5" cy="10.5" r="7.5" />
            <path d="M16 16l5 5" />
          </svg>
          <p className="mt-5 font-display text-base font-semibold tracking-tight text-ink">No Product Found</p>
          <p className="mx-auto mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-ink-muted">
            Nothing matched that search. Try a different keyword, or browse the departments.
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
  );
}
