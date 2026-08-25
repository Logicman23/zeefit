import Image from "next/image";
import Link from "next/link";
import type { StoreProduct } from "@/lib/storefront";
import { aed, discountPct } from "@/lib/format";

/** Card content matches the original: image, title, new price, struck old price, "Buy Now". */
export default function ProductCard({ product, priority = false }: { product: StoreProduct; priority?: boolean }) {
  const off = discountPct(product.price, product.oldPrice);
  // Slug, not the legacy numeric id: products created in the admin panel have
  // no legacy id, and the slug is the canonical URL for every product.
  const href = `/product/${product.slug}`;

  return (
    <article className="group flex flex-col">
      <Link href={href} className="card-media relative block aspect-[4/5] overflow-hidden bg-mist">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="object-cover"
        />

        {off !== null && (
          <span className="absolute left-0 top-0 bg-ink px-2.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-paper">
            −{off}%
          </span>
        )}

        {/* Precision hairline that draws across the image on hover */}
        <span className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-brand transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <h3 className="text-[0.875rem] font-medium leading-snug text-ink">
          <Link href={href} className="transition-colors hover:text-brand">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2.5 flex items-baseline gap-2.5">
          <span className="font-display text-base font-semibold tracking-tight text-ink">{aed(product.price)}</span>
          {product.oldPrice && (
            <span className="text-[0.8125rem] text-ink-muted line-through">{aed(product.oldPrice)}</span>
          )}
        </div>

        <Link
          href={href}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-line px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink transition-all duration-300 hover:border-brand hover:bg-brand hover:text-paper"
        >
          Buy Now
          <svg viewBox="0 0 14 8" className="h-2 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
            <path d="M0 4h12M9 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
