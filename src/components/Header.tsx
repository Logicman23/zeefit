"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileNav from "./MobileNav";
import { site } from "@/data/content";
import type { TopCategory } from "@/lib/storefront";

const LANGS = [
  { code: "en", label: "English", flag: "https://flagcdn.com/24x18/gb.png" },
  { code: "ar", label: "العربية", flag: "https://flagcdn.com/24x18/ae.png" },
];

export default function Header({
  children,
  catalog,
}: {
  children: React.ReactNode;
  catalog: TopCategory[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lang, setLang] = useState(LANGS[0]);
  const [langOpen, setLangOpen] = useState(false);
  const [q, setQ] = useState("");
  const [stuck, setStuck] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearchOpen(false);
    router.push(`/search-result?search_text=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header
      className={`sticky top-0 z-40 bg-paper/95 backdrop-blur-md transition-shadow duration-300 ${
        stuck
          ? "shadow-[0_1px_0_0_var(--color-line),0_12px_28px_-22px_rgba(11,20,24,0.5)]"
          : "shadow-[0_1px_0_0_var(--color-line)]"
      }`}
    >
      {/* Announcement strip — replaces the original empty .top utility bar */}
      <div className="bg-ink text-paper">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-2.5 px-4 py-2 text-center text-[0.625rem] uppercase tracking-[0.1em] sm:gap-3 sm:px-6 sm:text-[0.6875rem] sm:tracking-[0.14em]">
          <span className="h-1 w-1 shrink-0 bg-signal" aria-hidden />
          <span className="hidden sm:inline">Free shipping inside UAE · Items shipped within 24 hours</span>
          <span className="sm:hidden">Free shipping inside UAE</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex h-20 items-center gap-4 lg:h-24">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="-ml-2 flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand lg:hidden"
          >
            <svg viewBox="0 0 18 12" className="h-4 w-[18px]" aria-hidden>
              <path d="M0 1h18M0 6h18M0 11h12" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>

          {/* Wordmark */}
          <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label={site.name}>
            <span className="flex h-9 w-9 items-center justify-center bg-brand font-display text-base font-bold text-paper transition-colors duration-300 group-hover:bg-ink">
              Z
            </span>
            <span className="font-display text-xl font-semibold tracking-[-0.04em] text-ink lg:text-[1.375rem]">
              ZEE<span className="text-brand">FIT</span>
            </span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={submitSearch} role="search" className="ml-auto hidden max-w-md flex-1 lg:block">
            <div className="flex items-center border border-line bg-mist transition-colors focus-within:border-brand focus-within:bg-paper">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                name="search_text"
                type="text"
                placeholder="Search Product"
                aria-label="Search Product"
                className="w-full bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              <button
                type="submit"
                className="shrink-0 bg-brand px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink"
              >
                Search
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 lg:ml-4">
            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search Product"
              aria-expanded={searchOpen}
              className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand lg:hidden"
            >
              <svg
                viewBox="0 0 18 18"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <circle cx="7.5" cy="7.5" r="6" />
                <path d="M12 12l5 5" />
              </svg>
            </button>

            {/* Language switcher — EN / AR parity with the original Google Translate flags */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                aria-label="Change language"
                aria-expanded={langOpen}
                className="flex h-10 items-center gap-1.5 px-2 text-ink transition-colors hover:text-brand"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lang.flag} alt={lang.label} width={22} height={16} className="border border-line" />
                <svg viewBox="0 0 10 6" className="h-[5px] w-[9px] text-ink-muted" aria-hidden>
                  <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
              {langOpen && (
                <ul className="absolute right-0 top-full z-50 w-36 border border-line bg-paper py-1 shadow-[0_18px_36px_-20px_rgba(11,20,24,0.4)]">
                  {LANGS.map((l) => (
                    <li key={l.code}>
                      <button
                        onClick={() => {
                          setLang(l);
                          setLangOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[0.8125rem] text-ink-soft transition-colors hover:bg-mist hover:text-brand"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.flag} alt="" width={22} height={16} className="border border-line" />
                        {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cart — label reproduced verbatim */}
            <Link
              href="/cart"
              className="ml-1 flex items-center gap-2.5 border border-line px-3 py-2.5 transition-colors hover:border-brand hover:bg-brand hover:text-paper"
            >
              <svg
                viewBox="0 0 18 18"
                className="h-[17px] w-[17px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M1 1h2.5l2 10h9l2-7H5" />
                <circle cx="7" cy="15.5" r="1.4" />
                <circle cx="14" cy="15.5" r="1.4" />
              </svg>
              <span className="hidden text-[0.8125rem] font-medium sm:inline">Cart (AED0.00)</span>
            </Link>
          </div>
        </div>

        {/* Mobile search drawer */}
        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 lg:hidden ${
            searchOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <form onSubmit={submitSearch} role="search" className="pb-4">
              <div className="flex items-center border border-line bg-mist focus-within:border-brand focus-within:bg-paper">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text"
                  placeholder="Search Product"
                  aria-label="Search Product"
                  className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-muted"
                />
                <button
                  type="submit"
                  className="bg-brand px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-paper"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {children}
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} catalog={catalog} />
    </header>
  );
}
