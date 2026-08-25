import { Card } from "./ui";

/**
 * Stat tile: label + value, nothing more.
 *
 * No delta and no sparkline anywhere on this dashboard — the catalogue has no
 * historical snapshots yet, and a trend line drawn from a single reading would
 * be decoration pretending to be data.
 *
 * Values use the body sans with PROPORTIONAL figures. tabular-nums is reserved
 * for the product table's columns, where digits have to align vertically.
 */
export function StatTile({
  label,
  value,
  note,
  href,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  note?: string;
  href?: string;
  tone?: "neutral" | "brand" | "warn" | "alert";
}) {
  const tones = {
    neutral: "text-ink",
    brand: "text-brand",
    warn: "text-warn",
    alert: "text-alert",
  } as const;

  const body = (
    <>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
      <p className={`mt-2.5 font-sans text-[2rem] font-semibold leading-none ${tones[tone]}`}>
        {typeof value === "number" ? compact(value) : value}
      </p>
      {note && <p className="mt-2 text-[0.75rem] leading-snug text-ink-muted">{note}</p>}
    </>
  );

  if (href) {
    return (
      <Card className="p-5 transition-colors duration-300 hover:border-brand-200">
        <a href={href} className="block">
          {body}
        </a>
      </Card>
    );
  }
  return <Card className="p-5">{body}</Card>;
}

function compact(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/**
 * Meter — a single ratio against a limit, which is a meter and not a two-slice
 * pie. The unfilled track is a lighter step of the SAME ramp as the fill, so the
 * state reads across the whole bar rather than only at the boundary.
 *
 * Severity is never carried by colour alone: every meter renders its percentage
 * and a word ("Good" / "Needs work" / "Poor") next to the bar.
 */
export function Meter({
  label,
  value,
  total,
  goodAt = 90,
  warnAt = 60,
}: {
  label: string;
  value: number;
  total: number;
  goodAt?: number;
  warnAt?: number;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  const severity = pct >= goodAt ? "good" : pct >= warnAt ? "warn" : "poor";

  const style = {
    good: { fill: "bg-brand", track: "bg-brand-100", text: "text-brand", word: "Good" },
    warn: { fill: "bg-warn", track: "bg-warn/15", text: "text-warn", word: "Needs work" },
    poor: { fill: "bg-alert", track: "bg-alert/15", text: "text-alert", word: "Poor" },
  }[severity];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8125rem] text-ink-soft">{label}</span>
        <span className={`text-[0.75rem] font-semibold ${style.text}`}>
          {pct}% · {style.word}
        </span>
      </div>
      <div
        className={`mt-2 h-1.5 w-full overflow-hidden rounded-[2px] ${style.track}`}
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct} percent, ${style.word}`}
      >
        <div className={`h-full rounded-[2px] ${style.fill}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[0.75rem] text-ink-muted">
        {value.toLocaleString()} of {total.toLocaleString()} products
      </p>
    </div>
  );
}
