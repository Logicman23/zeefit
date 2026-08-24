"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type Slide = {
  eyebrow: string;
  heading: string;
  sub: string;
  cta: { label: string; href: string };
  altCta?: { label: string; href: string };
  media:
    | { type: "video"; src: string; poster: string }
    | {
        type: "image";
        src: string;
        /** Studio cut-outs on white read best contained on a light panel. */
        fit?: "cover" | "contain";
        /** Panel tone behind a contained image. */
        tone?: string;
        /** Crop anchor for cover images, so the subject stays in frame. */
        focus?: string;
      }
    /** Three cut-outs staggered into one composition — the catalog has no
        lifestyle activewear photography, and a lone cut-out reads as a weak hero. */
    | { type: "collage"; images: [string, string, string]; tone?: string };
};

const isLightPanel = (m: Slide["media"]) =>
  m.type === "collage" || (m.type === "image" && m.fit === "contain");

const AUTOPLAY_MS = 7000;

export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0);

  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const count = slides.length;
  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  /* Respect the OS reduced-motion setting: no autoplay, no sliding. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* Pause autoplay while the tab is hidden. */
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* Autoplay + progress bar. */
  useEffect(() => {
    if (reduced || paused || count < 2) return;
    setProgress(0);
    const started = Date.now();
    const tick = window.setInterval(() => {
      setProgress(Math.min(1, (Date.now() - started) / AUTOPLAY_MS));
    }, 50);
    const timer = window.setTimeout(next, AUTOPLAY_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timer);
    };
  }, [index, paused, reduced, next, count]);

  /* Only the active slide's video should be playing. */
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) v.play().catch(() => {});
      else v.pause();
    });
  }, [index]);

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null || touchY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    // Only treat as a swipe when the gesture is clearly horizontal — otherwise
    // it is the user scrolling the page.
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else prev();
    }
    touchX.current = null;
    touchY.current = null;
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative isolate overflow-hidden bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }}
    >
      {/* Track */}
      <div
        className="flex w-full"
        style={{
          transform: `translate3d(-${index * 100}%, 0, 0)`,
          transition: reduced ? "none" : "transform 800ms cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      >
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.heading}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              className="w-full shrink-0"
            >
              <div className="grid lg:grid-cols-2">
                {/* Media — first on mobile, second on desktop */}
                <div
                  className={`relative order-1 aspect-square w-full overflow-hidden sm:aspect-[16/9] lg:order-2 lg:aspect-auto lg:min-h-[38rem] ${
                    isLightPanel(s.media) ? "" : "bg-brand-900"
                  }`}
                  style={
                    isLightPanel(s.media)
                      ? { background: ("tone" in s.media && s.media.tone) || "#ffffff" }
                      : undefined
                  }
                >
                  {s.media.type === "collage" ? (
                    <div className="absolute inset-0 flex items-center justify-center gap-3 px-4 py-8 sm:gap-5 sm:px-10 lg:gap-6 lg:px-14">
                      {s.media.images.map((src, j) => (
                        <div
                          key={src}
                          className={`relative bg-paper shadow-[0_18px_40px_-28px_rgba(11,20,24,0.45)] ${
                            j === 1
                              ? "h-[88%] w-[38%] lg:h-[82%]"
                              : `h-[60%] w-[27%] lg:h-[56%] ${j === 0 ? "-translate-y-6" : "translate-y-6"}`
                          }`}
                        >
                          <Image
                            src={src}
                            alt=""
                            fill
                            priority={i === 0}
                            sizes="(max-width: 1024px) 33vw, 18vw"
                            className="object-contain p-3 sm:p-4"
                          />
                        </div>
                      ))}
                    </div>
                  ) : s.media.type === "video" ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[i] = el;
                      }}
                      autoPlay={i === 0}
                      muted
                      loop
                      playsInline
                      poster={s.media.poster}
                      className="absolute inset-0 h-full w-full object-cover"
                    >
                      <source src={s.media.src} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <Image
                      src={s.media.src}
                      alt=""
                      fill
                      priority={i === 0}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      style={
                        s.media.fit === "contain"
                          ? undefined
                          : { objectPosition: s.media.focus ?? "center 25%" }
                      }
                      className={
                        s.media.fit === "contain"
                          ? "object-contain p-6 sm:p-10 lg:p-12"
                          : "object-cover"
                      }
                    />
                  )}

                  {/* Scrim blends a dark media panel into the copy panel at the seam.
                      Contained images sit on a light tone and need no scrim. */}
                  {!isLightPanel(s.media) && (
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-ink lg:via-ink/25 lg:to-transparent"
                      aria-hidden
                    />
                  )}
                </div>

                {/* Copy */}
                <div className="relative order-2 flex items-center lg:order-1">
                  {/* Measurement grid — clinical precision motif */}
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    aria-hidden
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                      backgroundSize: "64px 64px",
                    }}
                  />

                  {/* Bottom padding reserves room for the absolutely-positioned controls. */}
                  <div className="relative w-full px-6 pb-28 pt-12 sm:px-10 sm:pb-32 sm:pt-16 lg:pb-28 lg:pt-24 lg:pl-[max(2.5rem,calc((100vw-1400px)/2+1.5rem))] lg:pr-16">
                    <span className="eyebrow inline-flex items-center gap-2.5 text-signal">
                      <span className="h-1 w-1 shrink-0 bg-signal" aria-hidden />
                      {s.eyebrow}
                    </span>

                    <h2 className="display mt-5 text-[2rem] text-paper sm:text-5xl lg:mt-7 lg:text-[3.75rem] xl:text-[4.25rem]">
                      {s.heading}
                    </h2>

                    <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-paper/70 sm:text-base lg:mt-7 lg:text-lg">
                      {s.sub}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4 lg:mt-11">
                      <Link
                        href={s.cta.href}
                        tabIndex={active ? 0 : -1}
                        className="group inline-flex items-center gap-3 bg-signal px-7 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:bg-paper sm:px-9 sm:py-4 sm:tracking-[0.18em]"
                      >
                        {s.cta.label}
                        <svg
                          viewBox="0 0 16 8"
                          className="h-2 w-4 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden
                        >
                          <path d="M0 4h14M11 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </Link>

                      {s.altCta && (
                        <Link
                          href={s.altCta.href}
                          tabIndex={active ? 0 : -1}
                          className="inline-flex items-center gap-3 border border-paper/30 px-7 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:border-paper hover:bg-paper hover:text-ink sm:px-9 sm:py-4 sm:tracking-[0.18em]"
                        >
                          {s.altCta.label}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      {count > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 lg:w-1/2">
          {/* Confined to the dark copy panel on desktop — light media panels would
              swallow white-on-transparent controls. */}
          <div className="flex items-end justify-between gap-6 px-6 pb-6 sm:px-10 lg:pb-8 lg:pl-[max(2.5rem,calc((100vw-1400px)/2+1.5rem))] lg:pr-16">
            {/* Dots + counter */}
            <div className="pointer-events-auto flex items-center gap-4">
              <div className="flex items-center gap-2.5" role="tablist" aria-label="Choose slide">
                {slides.map((s, i) => (
                  <button
                    key={s.heading}
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Go to slide ${i + 1}: ${s.heading}`}
                    onClick={() => go(i)}
                    className="group/dot relative h-6 py-2.5"
                  >
                    <span
                      className={`block h-[3px] transition-all duration-500 ${
                        i === index ? "w-10 bg-paper/30" : "w-4 bg-paper/30 group-hover/dot:bg-paper/60"
                      }`}
                    >
                      {i === index && (
                        <span
                          className="block h-full bg-signal"
                          style={{
                            width: reduced || paused ? "100%" : `${progress * 100}%`,
                            transition: "width 50ms linear",
                          }}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <span className="hidden font-display text-[0.6875rem] font-semibold tracking-[0.16em] text-paper/50 sm:inline">
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
            </div>

            {/* Arrows */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Previous slide"
                className="flex h-11 w-11 items-center justify-center border border-paper/25 text-paper transition-colors duration-300 hover:border-signal hover:bg-signal hover:text-ink sm:h-12 sm:w-12"
              >
                <svg viewBox="0 0 16 8" className="h-2 w-4 rotate-180" aria-hidden>
                  <path d="M0 4h14M11 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <button
                onClick={next}
                aria-label="Next slide"
                className="flex h-11 w-11 items-center justify-center border border-paper/25 text-paper transition-colors duration-300 hover:border-signal hover:bg-signal hover:text-ink sm:h-12 sm:w-12"
              >
                <svg viewBox="0 0 16 8" className="h-2 w-4" aria-hidden>
                  <path d="M0 4h14M11 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
