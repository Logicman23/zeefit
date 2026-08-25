"use client";

import { SEO_TITLE_MAX, SEO_DESCRIPTION_MAX } from "@/lib/validation/product";

/**
 * Live Google result preview.
 *
 * It mirrors Google's actual fallback behaviour rather than only echoing the
 * inputs: leave the SEO title blank and Google falls back to the page title, so
 * the preview does too — and says so. That is the difference between a preview
 * that teaches and one that just repeats what you typed.
 *
 * Google truncates on rendered PIXEL width (~600px), not characters, so the
 * character counters are guidance and the preview does the real truncation with
 * CSS line-clamping at a representative width.
 */
export default function SeoPreview({
  siteUrl,
  slug,
  seoTitle,
  seoDescription,
  fallbackTitle,
  fallbackDescription,
  noIndex,
}: {
  siteUrl: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  fallbackTitle: string;
  fallbackDescription: string;
  noIndex: boolean;
}) {
  const usingFallbackTitle = seoTitle.trim().length === 0;
  const usingFallbackDescription = seoDescription.trim().length === 0;

  const title = (usingFallbackTitle ? fallbackTitle : seoTitle).trim() || "Untitled product";
  const description =
    (usingFallbackDescription ? stripHtml(fallbackDescription) : seoDescription).trim() ||
    "No description yet — Google will pick its own snippet from the page copy.";

  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div>
      <div className="rounded-[2px] border border-line bg-paper p-5">
        {/* Deliberately not styled with the Zee Fit palette — it is a preview of
            someone else's surface, so it uses Google's own typography and blues. */}
        <div className="max-w-[600px] font-sans">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#dadce0] text-[0.5rem] font-semibold text-[#5f6368]">
              ZF
            </span>
            <div className="leading-tight">
              <p className="text-[0.75rem] text-[#202124]">Zee Fit</p>
              <p className="text-[0.75rem] text-[#4d5156]">
                {host} › product › <span className="text-[#4d5156]">{slug || "your-slug"}</span>
              </p>
            </div>
          </div>

          <h3 className="mt-1.5 line-clamp-1 text-[1.25rem] leading-[1.3] text-[#1a0dab] hover:underline">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[0.875rem] leading-[1.58] text-[#4d5156]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {noIndex && (
          <Note tone="alert">
            <strong>noindex is on.</strong> This product will not appear in search results at all,
            whatever the fields below say.
          </Note>
        )}
        {usingFallbackTitle && (
          <Note tone="muted">
            Falling back to the product title. Google will often rewrite it — set a search title to
            keep control.
          </Note>
        )}
        {usingFallbackDescription && (
          <Note tone="muted">
            Falling back to the short description. Google may substitute its own snippet.
          </Note>
        )}
      </div>
    </div>
  );
}

function Note({ tone, children }: { tone: "muted" | "alert"; children: React.ReactNode }) {
  return (
    <p
      className={`text-[0.75rem] leading-relaxed ${
        tone === "alert" ? "text-alert" : "text-ink-muted"
      }`}
    >
      {children}
    </p>
  );
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Character counter that turns amber near the limit and red past it. Shown
 * beside the field label so the editor sees budget, not just a violation.
 */
export function CharCounter({ value, max }: { value: string; max: number }) {
  const used = value.trim().length;
  const state = used > max ? "over" : used > max * 0.9 ? "near" : "ok";
  const tone = { ok: "text-ink-muted", near: "text-warn", over: "text-alert" }[state];

  return (
    <span className={`text-[0.6875rem] tabular-nums ${tone}`}>
      {used}/{max}
      {state === "over" && <span className="ml-1 font-semibold">over</span>}
    </span>
  );
}

export { SEO_TITLE_MAX, SEO_DESCRIPTION_MAX };
