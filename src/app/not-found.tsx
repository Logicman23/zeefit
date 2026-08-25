import Link from "next/link";
import StorefrontChrome from "@/components/StorefrontChrome";

/**
 * Root-level 404. Next renders this against the root layout, not the
 * (storefront) group's, so it wraps itself in the chrome explicitly.
 */
export default function NotFound() {
  return (
    <StorefrontChrome>
      <div className="mx-auto flex max-w-[1400px] flex-col items-center px-6 py-28 text-center lg:py-40">
        <span className="eyebrow text-brand">Error 404</span>
        <h1 className="display mt-6 text-4xl text-ink lg:text-6xl">Page Not Found</h1>
        <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-ink-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-3 bg-brand px-9 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-ink"
        >
          Back to Home
          <svg viewBox="0 0 16 8" className="h-2 w-4" aria-hidden>
            <path d="M0 4h14M11 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Link>
      </div>
    </StorefrontChrome>
  );
}
