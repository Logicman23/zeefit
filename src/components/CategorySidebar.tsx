"use client";

import { useState } from "react";
import Link from "next/link";
import { catalog, categoryHref } from "@/data/catalog";

/**
 * The original category page rendered the entire 55-node tree in a left rail on
 * every category page. Same tree, same order.
 *
 * On desktop it stays a sticky rail. On mobile the full tree would push the
 * product grid thousands of pixels down the page, so it collapses into a
 * disclosure that sits above the grid — visible without scrolling, but closed
 * by default.
 */
function Tree({ activeId, activeType, onNavigate }: { activeId: number; activeType: string; onNavigate?: () => void }) {
  const isActive = (id: number, type: string) => id === activeId && type === activeType;

  return (
    <div className="space-y-8">
      {catalog.map((top) => (
        <div key={top.id}>
          <Link
            href={categoryHref(top.id, "top-category")}
            onClick={onNavigate}
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
                  onClick={onNavigate}
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
                        onClick={onNavigate}
                        className={`block py-0.5 text-[0.8125rem] leading-snug transition-all duration-200 hover:translate-x-0.5 ${
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
  );
}

export default function CategorySidebar({ activeId, activeType }: { activeId: number; activeType: string }) {
  const [open, setOpen] = useState(false);
  const endCount = catalog.reduce((a, t) => a + t.children.reduce((b, m) => b + m.children.length, 0), 0);

  return (
    <>
      {/* Mobile: collapsible disclosure */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="category-tree-mobile"
          className="flex w-full items-center justify-between gap-4 border border-line bg-mist px-5 py-4 text-left transition-colors hover:border-brand"
        >
          <span className="flex items-center gap-3">
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M2 3.5h12M2 8h12M2 12.5h8" />
            </svg>
            <span className="font-display text-sm font-semibold tracking-tight text-ink">Browse Categories</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-muted">{endCount}</span>
            <svg
              viewBox="0 0 10 6"
              className={`h-[6px] w-[11px] text-ink-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
        </button>

        <div
          id="category-tree-mobile"
          className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <nav aria-label="Categories" className="border border-t-0 border-line px-5 py-6">
              <Tree activeId={activeId} activeType={activeType} onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop: sticky rail */}
      <nav aria-label="Categories" className="hidden lg:block lg:sticky lg:top-44">
        <h2 className="eyebrow border-b border-line pb-3 text-brand">Categories</h2>
        <div className="mt-6">
          <Tree activeId={activeId} activeType={activeType} />
        </div>
      </nav>
    </>
  );
}
