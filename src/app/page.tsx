import Link from "next/link";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import SectionHead from "@/components/SectionHead";
import { services, homeSections } from "@/data/content";
import { pick, featuredIds, latestIds, popularIds } from "@/data/products";
import { catalog, categoryHref } from "@/data/catalog";

const SERVICE_ICONS = [
  "M2 8h12M6 4L2 8l4 4",                                   // Easy Returns
  "M1 11h10V4H1zM11 7h3l2 2v2h-5z",                        // Free Shipping
  "M8 2v6l4 2",                                            // Fast Shipping
  "M3 8.5l3.5 3.5L14 4.5",                                 // Satisfaction
  "M4 7V5a4 4 0 118 0v2M3 7h10v7H3z",                      // Secure Checkout
  "M8 1v14M11 4H6.5a2.5 2.5 0 000 5h3a2.5 2.5 0 010 5H4",  // Money Back
];

function ProductRow({
  title,
  sub,
  items,
  priority = false,
}: {
  title: string;
  sub: string;
  items: ReturnType<typeof pick>;
  priority?: boolean;
}) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16 lg:py-24">
      <SectionHead title={title} sub={sub} />
      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={priority && i < 4} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />

      {/* Service promises — the original's six badges, rebuilt as a precision grid */}
      <section className="border-b border-line bg-mist">
        <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-16">
          <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-3 lg:grid-cols-6">
            {services.map((s, i) => (
              <div key={s.title} className="group bg-mist p-5 transition-colors duration-300 hover:bg-paper lg:p-6">
                <svg
                  viewBox="0 0 16 16"
                  className="h-5 w-5 text-brand transition-transform duration-300 group-hover:-translate-y-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="square"
                  aria-hidden
                >
                  <path d={SERVICE_ICONS[i]} />
                </svg>
                <h3 className="mt-4 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[0.75rem] leading-relaxed text-ink-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductRow
        title={homeSections.featured.title}
        sub={homeSections.featured.sub}
        items={pick(featuredIds)}
        priority
      />

      {/* Category gateway — the three top-level departments */}
      <section className="border-y border-line bg-mist">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:py-24">
          <SectionHead title="Shop by Department" sub="Three departments, fifty-five categories." />
          <div className="mt-12 grid gap-px bg-line md:grid-cols-3">
            {catalog.map((top) => (
              <Link
                key={top.id}
                href={categoryHref(top.id, "top-category")}
                className="group relative flex flex-col justify-between bg-paper p-8 transition-colors duration-300 hover:bg-ink lg:p-10"
              >
                <div>
                  <span className="eyebrow text-brand transition-colors duration-300 group-hover:text-signal">
                    {String(top.children.reduce((a, m) => a + m.children.length, 0)).padStart(2, "0")} categories
                  </span>
                  <h3 className="display mt-5 text-2xl text-ink transition-colors duration-300 group-hover:text-paper lg:text-3xl">
                    {top.name}
                  </h3>
                  <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-muted transition-colors duration-300 group-hover:text-paper/60">
                    {top.children.map((m) => m.name).join(" · ")}
                  </p>
                </div>
                <span className="mt-10 inline-flex items-center gap-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink transition-colors duration-300 group-hover:text-signal">
                  Explore
                  <svg viewBox="0 0 16 8" className="h-2 w-4 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden>
                    <path d="M0 4h14M11 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductRow title={homeSections.latest.title} sub={homeSections.latest.sub} items={pick(latestIds)} />

      <div className="border-t border-line" />

      <ProductRow title={homeSections.popular.title} sub={homeSections.popular.sub} items={pick(popularIds)} />
    </>
  );
}
