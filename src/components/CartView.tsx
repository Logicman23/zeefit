"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart, lineKey } from "@/lib/cart/CartContext";
import { aed } from "@/lib/format";

/**
 * The cart, and the order summary reused on checkout.
 *
 * Everything here is client-side because the cart itself is: there are no
 * customer accounts, so a guest's basket lives in their browser.
 */
export default function CartView({ compact = false }: { compact?: boolean }) {
  const cart = useCart();

  // Until localStorage has been read, the server-rendered markup and the client
  // disagree about what is in the basket. Render a neutral placeholder rather
  // than flashing "empty" at someone who has ten things in their cart.
  if (!cart.ready) {
    return (
      <div className="mx-auto max-w-lg px-8 py-20 text-center" aria-busy="true">
        <p className="text-[0.875rem] text-ink-muted">Loading your cart…</p>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
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
          className="mt-8 inline-flex items-center gap-2.5 border border-line bg-paper px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-paper"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14"}>
      <ul className="divide-y divide-line border-y border-line">
        {cart.lines.map((l) => {
          const key = lineKey(l);
          return (
            <li key={key} className="flex gap-4 py-5 sm:gap-6">
              <Link
                href={`/product/${l.slug}`}
                className="relative h-24 w-20 shrink-0 overflow-hidden bg-mist sm:h-28 sm:w-24"
              >
                {l.image && (
                  <Image src={l.image} alt="" fill sizes="96px" className="object-cover" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/product/${l.slug}`}
                  className="link-draw text-[0.875rem] font-medium text-ink"
                >
                  {l.name}
                </Link>

                {(l.size || l.color) && (
                  <p className="mt-1 text-[0.75rem] text-ink-muted">
                    {[l.size, l.color].filter(Boolean).join(" · ")}
                  </p>
                )}

                <p className="mt-1 text-[0.8125rem] text-ink-soft">{aed(l.price)} each</p>

                <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      onClick={() => cart.setQty(key, l.qty - 1)}
                      aria-label={`Decrease quantity of ${l.name}`}
                      className="px-3 py-2 text-ink-muted transition-colors hover:text-brand"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={l.qty}
                      onChange={(e) => cart.setQty(key, Number(e.target.value) || 1)}
                      aria-label={`Quantity of ${l.name}`}
                      className="w-12 border-x border-line bg-transparent py-2 text-center text-[0.8125rem] font-medium text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => cart.setQty(key, l.qty + 1)}
                      aria-label={`Increase quantity of ${l.name}`}
                      className="px-3 py-2 text-ink-muted transition-colors hover:text-brand"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => cart.remove(key)}
                    className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-alert"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="shrink-0 text-[0.875rem] font-semibold tabular-nums text-ink">
                {aed(l.price * l.qty)}
              </p>
            </li>
          );
        })}
      </ul>

      {!compact && (
        <aside className="lg:sticky lg:top-44 lg:h-fit">
          <div className="border border-line bg-mist p-6">
            <h2 className="display text-lg text-ink">Order Summary</h2>

            <dl className="mt-5 space-y-2.5 text-[0.875rem]">
              <div className="flex justify-between">
                <dt className="text-ink-muted">
                  Subtotal ({cart.count} item{cart.count === 1 ? "" : "s"})
                </dt>
                <dd className="tabular-nums text-ink">{aed(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd className="text-ink">Free inside UAE</dd>
              </div>
            </dl>

            <div className="mt-5 flex justify-between border-t border-line-strong pt-4">
              <span className="font-display text-[0.9375rem] font-semibold text-ink">Total</span>
              <span className="font-display text-lg font-semibold tabular-nums text-ink">
                {aed(cart.subtotal)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center gap-2 bg-brand px-8 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-ink"
            >
              Proceed to Checkout
            </Link>

            <div className="mt-4 flex justify-between">
              <Link
                href="/"
                className="link-draw text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
              >
                Continue shopping
              </Link>
              <button
                type="button"
                onClick={cart.clear}
                className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-alert"
              >
                Empty cart
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
