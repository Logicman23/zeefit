"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { EMIRATES } from "@/lib/validation/order";
import { placeOrder, type PlaceOrderState } from "@/app/(storefront)/checkout/actions";
import { aed } from "@/lib/format";
import CartView from "./CartView";

/**
 * Cash on delivery: no payment is taken here, so the form collects only what is
 * needed to deliver and to phone the customer to confirm.
 *
 * The cart travels as a hidden JSON field of slugs and quantities. Prices are
 * never submitted — the server re-reads them, because localStorage is the
 * customer's to edit.
 */
export default function CheckoutForm() {
  const cart = useCart();
  const [state, formAction, pending] = useActionState<PlaceOrderState, FormData>(placeOrder, {});
  const [placed, setPlaced] = useState<string | null>(null);

  const err = state.fieldErrors ?? {};

  // Clear the basket only once the order is safely recorded, never before.
  useEffect(() => {
    if (state.ok && state.reference) {
      setPlaced(state.reference);
      cart.clear();
    }
    // cart is recreated each render; depending on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, state.reference]);

  if (placed) {
    return (
      <div className="mx-auto max-w-xl border border-brand-200 bg-brand-50 px-8 py-14 text-center">
        <span className="eyebrow text-brand">Order received</span>
        <h2 className="display mt-4 text-3xl text-ink">Thank you</h2>
        <p className="mx-auto mt-4 max-w-sm text-[0.875rem] leading-relaxed text-ink-soft">
          We will call you shortly to confirm the details and arrange delivery. Payment is on
          delivery, in cash.
        </p>
        <p className="mt-6 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          Your reference
        </p>
        <p className="mt-1 font-mono text-xl font-semibold text-brand-900">{placed}</p>
        <Link
          href="/"
          className="mt-9 inline-flex items-center gap-2.5 bg-brand px-7 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ink"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (!cart.ready) {
    return <p className="py-16 text-center text-[0.875rem] text-ink-muted">Loading your cart…</p>;
  }

  if (cart.lines.length === 0) {
    return <CartView />;
  }

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
      {/* Slugs and quantities only — never prices. */}
      <input
        type="hidden"
        name="cart"
        value={JSON.stringify(
          cart.lines.map((l) => ({ slug: l.slug, size: l.size, color: l.color, qty: l.qty }))
        )}
      />

      <div>
        {state.error && (
          <div className="mb-6 border border-alert/30 bg-alert/5 px-4 py-3" role="alert">
            <p className="text-[0.875rem] text-alert">{state.error}</p>
            {state.rejected && state.rejected.length > 0 && (
              <ul className="mt-2 space-y-1">
                {state.rejected.map((r) => (
                  <li key={r.slug} className="text-[0.8125rem] text-alert">
                    {cart.lines.find((l) => l.slug === r.slug)?.name ?? r.slug} — {r.reason}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/cart"
              className="link-draw mt-3 inline-block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-alert"
            >
              Review cart
            </Link>
          </div>
        )}

        <h2 className="rule-tick pt-6 font-display text-lg font-semibold tracking-tight text-ink">
          Delivery Details
        </h2>

        <div className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="customerName" label="Full name" required error={err.customerName} autoComplete="name" />
            <TextField
              name="customerPhone"
              label="Mobile number"
              required
              error={err.customerPhone}
              autoComplete="tel"
              placeholder="050 123 4567"
              hint="We will call to confirm your order."
            />
          </div>

          <TextField
            name="customerEmail"
            label="Email"
            type="email"
            error={err.customerEmail}
            autoComplete="email"
            hint="Optional. For a written copy of your order."
          />

          <TextField
            name="addressLine1"
            label="Address"
            required
            error={err.addressLine1}
            autoComplete="address-line1"
            placeholder="Building, street"
          />
          <TextField
            name="addressLine2"
            label="Apartment, floor, landmark"
            error={err.addressLine2}
            autoComplete="address-line2"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="city" label="Area / city" required error={err.city} autoComplete="address-level2" />
            <div>
              <label
                htmlFor="emirate"
                className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
              >
                Emirate <span className="text-alert">*</span>
              </label>
              <select
                id="emirate"
                name="emirate"
                required
                defaultValue=""
                className={`w-full border bg-paper px-3 py-3 text-[0.875rem] text-ink outline-none focus:border-brand ${
                  err.emirate ? "border-alert" : "border-line"
                }`}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {EMIRATES.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              {err.emirate && <p className="mt-1.5 text-[0.75rem] text-alert">{err.emirate}</p>}
            </div>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
            >
              Delivery notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Anything the driver should know"
              className="w-full border border-line bg-paper px-3 py-3 text-[0.875rem] text-ink outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-44 lg:h-fit">
        <div className="border border-line bg-mist p-6">
          <h2 className="display text-lg text-ink">Order Summary</h2>

          <ul className="mt-5 space-y-3 border-b border-line pb-5">
            {cart.lines.map((l) => (
              <li key={`${l.slug}${l.size}${l.color}`} className="flex justify-between gap-3 text-[0.8125rem]">
                <span className="min-w-0 flex-1 text-ink-soft">
                  <span className="block truncate text-ink">{l.name}</span>
                  <span className="text-ink-muted">
                    {[l.size, l.color].filter(Boolean).join(" · ")}
                    {(l.size || l.color) && " · "}×{l.qty}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-ink">{aed(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 text-[0.875rem]">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="tabular-nums text-ink">{aed(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Shipping</dt>
              <dd className="text-ink">Free inside UAE</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Payment</dt>
              <dd className="text-ink">Cash on delivery</dd>
            </div>
          </dl>

          <div className="mt-5 flex justify-between border-t border-line-strong pt-4">
            <span className="font-display text-[0.9375rem] font-semibold text-ink">Total</span>
            <span className="font-display text-lg font-semibold tabular-nums text-ink">
              {aed(cart.subtotal)}
            </span>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-brand px-8 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-ink disabled:cursor-not-allowed disabled:bg-line-strong"
          >
            {pending ? "Placing order…" : "Place Order"}
          </button>

          <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-muted">
            No payment is taken now. You pay the driver in cash when your order arrives.
          </p>
        </div>
      </aside>
    </form>
  );
}

function TextField({
  name,
  label,
  error,
  hint,
  required,
  type = "text",
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
      >
        {label}
        {required && <span className="ml-1 text-alert">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        {...rest}
        className={`w-full border bg-paper px-3 py-3 text-[0.875rem] text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand ${
          error ? "border-alert" : "border-line"
        }`}
      />
      {error ? (
        <p className="mt-1.5 text-[0.75rem] text-alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.75rem] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
