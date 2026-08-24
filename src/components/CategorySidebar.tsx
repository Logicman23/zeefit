import Link from "next/link";
import { catalog, categoryHref } from "@/data/catalog";

/**
 * The original category page rendered the entire 55-node tree in a left rail on
 * every category page. Same tree, same order — restructured as a scannable
 * indented index with the active branch highlighted.
 */
export default function CategorySidebar({ activeId, activeType }: { activeId: number; activeType: string }) {
  const isActive = (id: number, type: string) => id === activeId && type === activeType;

  return (
    <nav aria-label="Categories" className="lg:sticky lg:top-44">
      <h2 className="eyebrow border-b border-line pb-3 text-brand">Categories</h2>

      <div className="mt-6 space-y-8">
        {catalog.map((top) => (
          <div key={top.id}>
            <Link
              href={categoryHref(top.id, "top-category")}
              className={`link-draw font-display text-sm font-semibold tracking-tight transition-colors ${
                isActive(top.id, "top-category") ? "text-brand" : "text-ink hover:text-brand"
              }`}
            >
              {top.name}
            </Link>

            <ul className="mt-3 space-y-4">
              {top.children.map((mid) => (
                <li key={mid.id}>
                  <Link
                    href={categoryHref(mid.id, "mid-category")}
                    className={`text-[0.8125rem] font-medium transition-colors ${
                      isActive(mid.id, "mid-category") ? "text-brand" : "text-ink-soft hover:text-brand"
                    }`}
                  >
                    {mid.name}
                  </Link>
                  <ul className="mt-2 space-y-1.5 border-l border-line pl-3.5">
                    {mid.children.map((end) => (
                      <li key={end.id}>
                        <Link
                          href={categoryHref(end.id, "end-category")}
                          className={`block text-[0.8125rem] leading-snug transition-all duration-200 hover:translate-x-0.5 ${
                            isActive(end.id, "end-category")
                              ? "font-medium text-brand"
                              : "text-ink-muted hover:text-brand"
                          }`}
                        >
                          {end.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
