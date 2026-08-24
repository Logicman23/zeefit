import { newsletter } from "@/data/content";

export default function Newsletter() {
  return (
    <section className="border-t border-line bg-ink text-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end lg:gap-20">
          <div>
            <span className="eyebrow text-signal">Stay in the loop</span>
            <h2 className="display mt-4 text-3xl text-paper sm:text-4xl lg:text-5xl">
              {newsletter.heading}
            </h2>
          </div>

          <form className="w-full" action="" method="post">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">
              <input
                type="email"
                name="email_subscribe"
                required
                placeholder={newsletter.placeholder}
                aria-label={newsletter.placeholder}
                className="w-full border border-paper/25 bg-transparent px-5 py-4 text-sm text-paper outline-none transition-colors placeholder:text-paper/45 focus:border-signal"
              />
              <button
                type="submit"
                name="form_subscribe"
                className="shrink-0 bg-signal px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-paper"
              >
                {newsletter.button}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
