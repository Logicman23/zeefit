import type { ProductStatus } from "@/generated/prisma";

/**
 * Admin primitives, drawn from the storefront's "Clinical Performance" system:
 * 2px corners, hairline rules, teal brand, uppercase eyebrows. No hooks here, so
 * these import cleanly into both Server and Client Components.
 */

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[2px] border border-line bg-paper ${className}`}>{children}</div>
  );
}

export function Section({
  title,
  step,
  description,
  children,
}: {
  title: string;
  step?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line bg-mist px-6 py-4">
        <div className="flex items-baseline gap-3">
          {step && (
            <span className="eyebrow text-brand-400" aria-hidden>
              {step}
            </span>
          )}
          <h2 className="display text-[1.0625rem] text-ink">{title}</h2>
        </div>
        {description && <p className="mt-1 text-[0.8125rem] text-ink-muted">{description}</p>}
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </Card>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  counter,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  counter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
        >
          {label}
          {required && (
            <span className="ml-1 text-alert" aria-hidden>
              *
            </span>
          )}
        </label>
        {counter}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-[0.75rem] text-alert" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.75rem] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL =
  "w-full rounded-[2px] border bg-paper px-3 py-2.5 text-[0.875rem] text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-mist disabled:text-ink-muted";

export function inputClass(hasError?: boolean) {
  return `${CONTROL} ${hasError ? "border-alert" : "border-line"}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-brand text-paper hover:bg-ink",
    secondary: "border border-line-strong bg-paper text-ink hover:border-brand hover:text-brand",
    ghost: "text-ink-soft hover:bg-mist hover:text-ink",
    danger: "border border-alert/40 bg-paper text-alert hover:bg-alert hover:text-paper",
  } as const;

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-[2px] px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
    />
  );
}

const STATUS_STYLES: Record<ProductStatus, string> = {
  PUBLISHED: "bg-brand-50 text-brand-700 border-brand-200",
  DRAFT: "bg-haze text-ink-soft border-line-strong",
  ARCHIVED: "bg-paper text-ink-muted border-line",
};

export function StatusPill({ status }: { status: ProductStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLES[status]}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <div className="rule-tick relative pt-5">
        <h3 className="display text-xl text-ink">{title}</h3>
      </div>
      <p className="mt-3 max-w-sm text-[0.875rem] leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
