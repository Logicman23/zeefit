import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { aboutCopy, services } from "@/data/content";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <>
      <PageHeader title={aboutCopy.heading} />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div className="prose-clinical max-w-2xl text-[1rem]">
            {aboutCopy.paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "text-[1.0625rem] leading-relaxed text-ink" : undefined}>
                {p}
              </p>
            ))}
          </div>

          <div className="relative aspect-[4/5] overflow-hidden bg-mist lg:sticky lg:top-44 lg:self-start">
            <Image
              src="/products/product-featured-96.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <section className="border-t border-line bg-mist">
        <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-20">
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="bg-mist p-7 transition-colors duration-300 hover:bg-paper lg:p-8">
                <h3 className="font-display text-sm font-semibold uppercase tracking-[0.08em] text-ink">{s.title}</h3>
                <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
