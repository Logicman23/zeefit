import PageHeader from "@/components/PageHeader";
import { faq } from "@/data/content";

export const metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <>
      <PageHeader title="FAQ" />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-20">
        <div className="mx-auto max-w-3xl divide-y divide-line border-y border-line">
          {faq.map((item, i) => (
            <details key={i} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                <h2 className="font-display text-[1rem] font-semibold leading-snug tracking-tight text-ink transition-colors group-open:text-brand lg:text-[1.0625rem]">
                  {item.q}
                </h2>
                <span
                  className="relative mt-1.5 h-3 w-3 shrink-0 text-ink-muted transition-colors group-open:text-brand"
                  aria-hidden
                >
                  <span className="absolute left-0 top-1/2 h-[1.5px] w-3 -translate-y-1/2 bg-current" />
                  <span className="absolute left-1/2 top-0 h-3 w-[1.5px] -translate-x-1/2 bg-current transition-transform duration-300 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>

              <div className="pb-8">
                <span className="eyebrow mb-4 block text-brand">Answer</span>
                <div className="prose-clinical max-w-none">
                  {item.blocks.map((b, j) =>
                    b.type === "p" ? (
                      <p key={j}>{b.text}</p>
                    ) : (
                      <ul key={j}>
                        {b.items.map((t, k) => (
                          <li key={k}>{t}</li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
