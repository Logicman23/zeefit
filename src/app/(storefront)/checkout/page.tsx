import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import CartView from "@/components/CartView";

export const metadata = { title: "Checkout" };

/**
 * Checkout is deliberately incomplete, and says so rather than pretending.
 *
 * The cart works end to end, but taking an order means deciding how the money
 * arrives — cash on delivery, bank transfer, or a card processor — and each
 * answer builds something different. A form that collected an address and then
 * dropped it on the floor would be worse than this page.
 */
export default function CheckoutPage() {
  return (
    <>
      <PageHeader title="Checkout" />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-20">
        <div className="mb-10 border border-line-strong bg-mist px-6 py-5">
          <h2 className="display text-lg text-ink">Checkout is not switched on yet</h2>
          <p className="mt-2 max-w-2xl text-[0.875rem] leading-relaxed text-ink-soft">
            Your basket is saved and will still be here later. Orders cannot be placed until a
            payment method is configured for the store.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 border border-line bg-paper px-6 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-brand hover:text-brand"
            >
              Back to Cart
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-brand px-6 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ink"
            >
              Order by Enquiry
            </Link>
          </div>
        </div>

        <h2 className="rule-tick pt-6 font-display text-lg font-semibold tracking-tight text-ink">
          Your Order
        </h2>
        <div className="mt-8">
          <CartView />
        </div>
      </div>
    </>
  );
}
