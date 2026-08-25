import Link from "next/link";
import { staticLinks, categoryHref } from "@/data/catalog";
import { getCatalog } from "@/lib/storefront";

/**
 * Desktop navigation. Reproduces the original 3-level hierarchy exactly:
 * top-category -> mid-category -> end-category, same labels, same order.
 * Rendered as a full-width mega panel instead of the original cascading flyouts.
 */
export default async function MegaNav() {
  const catalog = await getCatalog();
  return (
    <nav aria-label="Primary" className="hidden lg:block border-t border-line bg-paper">
      <div className="mx-auto max-w-[1400px] px-6">
        <ul className="flex items-stretch gap-1">
          <li>
            <Link
              href="/"
              className="flex h-14 items-center px-4 text-[0.8125rem] font-medium tracking-wide text-ink transition-colors hover:text-brand"
            >
              Home
            </Link>
          </li>

          {catalog.map((top) => (
            <li key={top.id} className="menu-root static">
              <Link
                href={categoryHref(top.id, "top-category")}
                className="group/t flex h-14 items-center gap-1.5 px-4 text-[0.8125rem] font-medium tracking-wide text-ink transition-colors hover:text-brand"
              >
                {top.name}
                <svg
                  viewBox="0 0 10 6"
                  className="h-[5px] w-[9px] text-ink-muted transition-transform duration-300 group-hover/t:translate-y-0.5"
                  aria-hidden
                >
                  <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </Link>

              {/* Mega panel */}
              <div className="menu-panel absolute left-0 right-0 top-full z-50 border-y border-line bg-paper shadow-[0_24px_48px_-24px_rgba(11,20,24,0.25)]">
                <div className="mx-auto max-w-[1400px] px-6 py-10">
                  <div className="mb-8 flex items-baseline justify-between border-b border-line pb-4">
                    <span className="eyebrow text-brand">{top.name}</span>
                    <Link
                      href={categoryHref(top.id, "top-category")}
                      className="link-draw text-xs font-medium text-ink-soft hover:text-brand"
                    >
                      View all {top.name}
                    </Link>
                  </div>

                  <div
                    className="grid gap-x-8 gap-y-10"
                    style={{ gridTemplateColumns: `repeat(${Math.min(top.children.length, 4)}, minmax(0,1fr))` }}
                  >
                    {top.children.map((mid) => (
                      <div key={mid.id}>
                        <Link
                          href={categoryHref(mid.id, "mid-category")}
                          className="link-draw mb-4 inline-block font-display text-sm font-semibold tracking-tight text-ink hover:text-brand"
                        >
                          {mid.name}
                        </Link>
                        <ul className="space-y-2 border-l border-line pl-4">
                          {mid.children.map((end) => (
                            <li key={end.id}>
                              <Link
                                href={categoryHref(end.id, "end-category")}
                                className="block text-[0.8125rem] leading-snug text-ink-muted transition-all duration-200 hover:translate-x-0.5 hover:text-brand"
                              >
                                {end.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}

          {staticLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex h-14 items-center px-4 text-[0.8125rem] font-medium tracking-wide text-ink transition-colors hover:text-brand"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
