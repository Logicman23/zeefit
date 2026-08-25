"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { staticLinks, categoryHref } from "@/data/catalog";
import type { TopCategory } from "@/lib/storefront";

/**
 * Mobile drawer. Same hierarchy and ordering as the desktop mega menu,
 * expressed as progressive accordions so the 3 levels stay navigable on small screens.
 */
export default function MobileNav({
  open,
  onClose,
  catalog,
}: {
  open: boolean;
  onClose: () => void;
  /** Passed down from the server layout — a client component cannot query. */
  catalog: TopCategory[];
}) {
  const [openTop, setOpenTop] = useState<number | null>(null);
  const [openMid, setOpenMid] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  /**
   * Rendered through a portal to <body>. The header carries `backdrop-filter`,
   * which makes it the containing block for fixed-position descendants — inside
   * it, `fixed inset-y-0` resolves against the header box and the drawer
   * collapses to header height instead of filling the viewport.
   */
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-label="Menu"
        aria-modal="true"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(92vw,26rem)] flex-col bg-paper transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <span className="eyebrow text-brand">Menu</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center border border-line text-ink transition-colors hover:border-brand hover:text-brand"
          >
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <Link
            href="/"
            onClick={onClose}
            className="block border-b border-line px-6 py-4 font-display text-sm font-semibold tracking-tight text-ink"
          >
            Home
          </Link>

          {catalog.map((top) => {
            const isOpen = openTop === top.id;
            return (
              <div key={top.id} className="border-b border-line">
                <div className="flex items-stretch">
                  <Link
                    href={categoryHref(top.id, "top-category")}
                    onClick={onClose}
                    className="flex-1 px-6 py-4 font-display text-sm font-semibold tracking-tight text-ink"
                  >
                    {top.name}
                  </Link>
                  <button
                    onClick={() => {
                      setOpenTop(isOpen ? null : top.id);
                      setOpenMid(null);
                    }}
                    aria-expanded={isOpen}
                    aria-label={`Toggle ${top.name}`}
                    className="w-14 border-l border-line text-ink-muted transition-colors hover:text-brand"
                  >
                    <svg
                      viewBox="0 0 10 6"
                      className={`mx-auto h-[6px] w-[11px] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  </button>
                </div>

                <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="bg-mist px-6 pb-4">
                      {top.children.map((mid) => {
                        const midOpen = openMid === mid.id;
                        return (
                          <div key={mid.id} className="border-b border-line/70 last:border-0">
                            <div className="flex items-stretch">
                              <Link
                                href={categoryHref(mid.id, "mid-category")}
                                onClick={onClose}
                                className="flex-1 py-3 text-[0.8125rem] font-medium text-ink"
                              >
                                {mid.name}
                              </Link>
                              <button
                                onClick={() => setOpenMid(midOpen ? null : mid.id)}
                                aria-expanded={midOpen}
                                aria-label={`Toggle ${mid.name}`}
                                className="w-10 text-ink-muted transition-colors hover:text-brand"
                              >
                                <svg
                                  viewBox="0 0 10 6"
                                  className={`mx-auto h-[6px] w-[11px] transition-transform duration-300 ${midOpen ? "rotate-180" : ""}`}
                                  aria-hidden
                                >
                                  <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                                </svg>
                              </button>
                            </div>
                            <div className={`grid transition-[grid-template-rows] duration-300 ${midOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                              <div className="overflow-hidden">
                                <ul className="space-y-1 border-l border-line pb-3 pl-4">
                                  {mid.children.map((end) => (
                                    <li key={end.id}>
                                      <Link
                                        href={categoryHref(end.id, "end-category")}
                                        onClick={onClose}
                                        className="block py-1.5 text-[0.8125rem] text-ink-muted transition-colors hover:text-brand"
                                      >
                                        {end.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {staticLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="block border-b border-line px-6 py-4 font-display text-sm font-semibold tracking-tight text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}
