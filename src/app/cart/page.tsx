import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <>
      <PageHeader title="Cart" />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-24">
        <div className="mx-auto max-w-lg border border-dashed border-line-strong bg-mist px-8 py-20 text-center">
          <svg
            viewBox="0 0 24 24"
            className="mx-auto h-9 w-9 text-line-strong"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden
          >
            <path d="M2 2h3l2.5 12h11l2.5-9H6" />
            <circle cx="9" cy="20" r="1.6" />
            <circle cx="18" cy="20" r="1.6" />
          </svg>

          <h2 className="display mt-6 text-2xl text-ink">Cart is Empty!!</h2>
          <p className="mx-auto mt-3 max-w-xs text-[0.875rem] leading-relaxed text-ink-muted">
            Add products to the cart in order to view it here.
          </p>

          <Link
            href="/"
            className="mt-9 inline-flex items-center gap-3 bg-brand px-9 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-ink"
          >
            Continue Shopping
            <svg viewBox="0 0 16 8" className="h-2 w-4" aria-hidden>
              <path d="M0 4h14M11 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}
