import Link from "next/link";

export default function PageHeader({ title, trail = [] }: { title: string; trail?: string[] }) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-6 py-10 lg:py-14">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[0.75rem] text-ink-muted">
          <Link href="/" className="transition-colors hover:text-brand">
            Home
          </Link>
          {[...trail, title].map((t, i, arr) => (
            <span key={t + i} className="flex items-center gap-2">
              <span className="text-line-strong" aria-hidden>
                /
              </span>
              <span className={i === arr.length - 1 ? "text-ink" : ""}>{t}</span>
            </span>
          ))}
        </nav>
        <h1 className="display mt-6 text-3xl text-ink sm:text-4xl lg:text-[3rem]">{title}</h1>
      </div>
    </div>
  );
}
