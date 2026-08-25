"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { StoreProduct as Product } from "@/lib/storefront";
import { aed, discountPct } from "@/lib/format";
import { useCart } from "@/lib/cart/CartContext";

const TABS = [
  { key: "description", label: "Product Description" },
  { key: "features", label: "Features" },
  { key: "conditions", label: "Conditions" },
  { key: "returnPolicy", label: "Return Policy" },
] as const;

export default function ProductDetail({ product }: { product: Product }) {
  const images = [product.image, ...product.gallery];
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("description");
  const [added, setAdded] = useState(false);
  const off = discountPct(product.price, product.oldPrice);
  const cart = useCart();
  const router = useRouter();

  const line = {
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    size,
    color,
  };

  function addToCart() {
    cart.add(line, qty);
    setAdded(true);
    // Confirmation is transient: a permanently green button would be lying by
    // the time the shopper comes back to this page.
    window.setTimeout(() => setAdded(false), 2500);
  }

  function buyNow() {
    cart.add(line, qty);
    router.push("/checkout");
  }

  return (
    <>
      <div className="grid gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-44 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden bg-mist">
            <Image
              src={images[active]}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="object-cover"
            />
            {off !== null && (
              <span className="absolute left-0 top-0 bg-ink px-3 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-paper">
                {off}% Off
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden border transition-colors ${
                    i === active ? "border-brand" : "border-line hover:border-line-strong"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy panel */}
        <div>
          <h1 className="display text-2xl text-ink sm:text-3xl lg:text-[2.5rem]">{product.name}</h1>

          {product.short && (
            <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">{product.short}</p>
          )}

          <div className="mt-8 border-y border-line py-6">
            <span className="eyebrow text-ink-muted">Product Price</span>
            <div className="mt-2.5 flex items-baseline gap-4">
              <span className="display text-3xl text-brand lg:text-4xl">{aed(product.price)}</span>
              {product.oldPrice && (
                <span className="text-base text-ink-muted line-through">{aed(product.oldPrice)}</span>
              )}
            </div>
          </div>

          {product.sizes.length > 0 && (
            <fieldset className="mt-8">
              <legend className="eyebrow text-ink-muted">Select Size</legend>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={`min-w-[3.25rem] border px-4 py-2.5 text-[0.8125rem] font-medium transition-all duration-200 ${
                      size === s
                        ? "border-brand bg-brand text-paper"
                        : "border-line text-ink-soft hover:border-brand hover:text-brand"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {product.colors.length > 0 && (
            <fieldset className="mt-8">
              <legend className="eyebrow text-ink-muted">Select Color</legend>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-pressed={color === c}
                    className={`border px-4 py-2.5 text-[0.8125rem] font-medium transition-all duration-200 ${
                      color === c
                        ? "border-brand bg-brand text-paper"
                        : "border-line text-ink-soft hover:border-brand hover:text-brand"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-8">
            <span className="eyebrow text-ink-muted">Quantity</span>
            <div className="mt-3.5 inline-flex items-stretch border border-line">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-12 text-lg text-ink-soft transition-colors hover:bg-mist hover:text-brand"
              >
                &minus;
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                aria-label="Quantity"
                className="w-16 border-x border-line bg-transparent py-3 text-center text-sm font-medium text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-12 text-lg text-ink-soft transition-colors hover:bg-mist hover:text-brand"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={addToCart}
              disabled={!product.inStock}
              className="flex-1 border border-ink bg-paper px-8 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-line disabled:text-ink-muted disabled:hover:bg-paper"
            >
              {added ? "Added ✓" : product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
            <button
              type="button"
              onClick={buyNow}
              disabled={!product.inStock}
              className="flex-1 bg-brand px-8 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-ink disabled:cursor-not-allowed disabled:bg-line-strong"
            >
              Buy Now
            </button>
          </div>

          <div className="mt-9 border-t border-line pt-6">
            <span className="eyebrow text-ink-muted">Share This Product</span>
            <div className="mt-3.5 flex gap-2.5">
              {["Facebook", "X", "WhatsApp", "Copy link"].map((n) => (
                <button
                  key={n}
                  aria-label={n}
                  title={n}
                  className="flex h-10 w-10 items-center justify-center border border-line text-[0.6875rem] font-semibold text-ink-muted transition-colors hover:border-brand hover:bg-brand hover:text-paper"
                >
                  {n[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — the same four panes as the original */}
      <div className="border-t border-line py-12 lg:py-16">
        <div className="flex flex-wrap gap-x-1 gap-y-2 border-b border-line" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-5 py-3.5 text-[0.8125rem] font-medium transition-colors ${
                tab === t.key ? "text-brand" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
              <span
                className={`absolute -bottom-px left-0 h-[2px] w-full origin-left bg-brand transition-transform duration-300 ${
                  tab === t.key ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          ))}
        </div>

        <div
          className="prose-clinical mt-9 max-w-3xl text-[0.9375rem]"
          dangerouslySetInnerHTML={{ __html: product[tab] || "<p>Not available.</p>" }}
        />
      </div>

      {/* Reviews — copy reproduced verbatim */}
      <div className="border-t border-line py-12 lg:py-16">
        <h2 className="rule-tick pt-6 font-display text-lg font-semibold tracking-tight text-ink">Reviews (0)</h2>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <p className="border border-dashed border-line-strong bg-mist px-6 py-10 text-center text-[0.875rem] text-ink-muted">
            Review not found
          </p>
          <div className="border border-line px-6 py-8">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.08em] text-ink">Give a Review</h3>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-muted">
              You must have to login to give a review
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2.5 border border-line px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-paper"
            >
              Customer Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
