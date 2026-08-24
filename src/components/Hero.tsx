import Link from "next/link";
import { hero } from "@/data/content";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/products/product-featured-89.png"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      >
        <source src="/brand/hero.mp4" type="video/mp4" />
        {hero.videoFallback}
      </video>

      {/* Graded scrim keeps the copy legible over any frame of the loop */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/25" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden />

      {/* Measurement grid — clinical precision motif */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative mx-auto flex min-h-[78vh] max-w-[1400px] items-center px-6 py-24 lg:min-h-[86vh]">
        <div className="max-w-2xl">
          <span className="eyebrow inline-flex items-center gap-2.5 text-signal">
            <span className="h-1 w-1 bg-signal" aria-hidden />
            Performance · Everyday · Medical
          </span>

          <h1 className="display mt-7 text-[2.5rem] text-paper sm:text-6xl lg:text-[4.5rem]">
            {hero.heading}
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-paper/70 lg:text-lg">
            {hero.sub}
          </p>

          <div className="mt-11 flex flex-wrap items-center gap-4">
            <Link
              href={hero.ctaHref}
              className="group inline-flex items-center gap-3 bg-signal px-9 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:bg-paper"
            >
              {hero.cta}
              <svg viewBox="0 0 16 8" className="h-2 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                <path d="M0 4h14M11 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Link>

            <Link
              href="/product-category?id=6&type=top-category"
              className="inline-flex items-center gap-3 border border-paper/30 px-9 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors duration-300 hover:border-paper hover:bg-paper hover:text-ink"
            >
              Medical Apparel
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
