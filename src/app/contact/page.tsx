import PageHeader from "@/components/PageHeader";
import { contactCopy, site } from "@/data/content";

export const metadata = { title: "Contact Us" };

const FIELDS = [
  { name: "name", label: contactCopy.fields.name, type: "text", autoComplete: "name" },
  { name: "email", label: contactCopy.fields.email, type: "email", autoComplete: "email" },
  { name: "phone", label: contactCopy.fields.phone, type: "tel", autoComplete: "tel" },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader title={contactCopy.heading} />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          {/* Contact Form */}
          <div>
            <h2 className="rule-tick pt-6 font-display text-lg font-semibold tracking-tight text-ink">
              {contactCopy.formTitle}
            </h2>

            <form className="mt-10 space-y-7" action="" method="post">
              {FIELDS.map((f) => (
                <div key={f.name}>
                  <label
                    htmlFor={f.name}
                    className="eyebrow mb-2.5 block text-ink-muted"
                  >
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    autoComplete={f.autoComplete}
                    className="w-full border border-line bg-mist px-4 py-3.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:bg-paper"
                  />
                </div>
              ))}

              <div>
                <label htmlFor="message" className="eyebrow mb-2.5 block text-ink-muted">
                  {contactCopy.fields.message}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full resize-y border border-line bg-mist px-4 py-3.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:bg-paper"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-3 bg-brand px-10 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-ink"
              >
                Send Message
                <svg viewBox="0 0 16 8" className="h-2 w-4" aria-hidden>
                  <path d="M0 4h14M11 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </form>
          </div>

          {/* Our office */}
          <aside>
            <h2 className="rule-tick pt-6 font-display text-lg font-semibold tracking-tight text-ink">
              {contactCopy.officeTitle}
            </h2>

            <dl className="mt-10 divide-y divide-line border-y border-line">
              <div className="flex gap-5 py-5">
                <svg
                  viewBox="0 0 16 16"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden
                >
                  <path d="M8 15s5-4.5 5-8.5A5 5 0 003 6.5C3 10.5 8 15 8 15z" />
                  <circle cx="8" cy="6.5" r="1.8" />
                </svg>
                <div>
                  <dt className="eyebrow text-ink-muted">Address</dt>
                  <dd className="mt-1.5 text-[0.9375rem] text-ink">{contactCopy.address}</dd>
                </div>
              </div>

              <div className="flex gap-5 py-5">
                <svg
                  viewBox="0 0 16 16"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden
                >
                  <path d="M2.5 3.5c0 5.5 4.5 10 10 10l1.5-2.5-3-1.5-1.5 1.5A11 11 0 0 1 5 8L6.5 6.5 5 3.5z" />
                </svg>
                <div>
                  <dt className="eyebrow text-ink-muted">{contactCopy.phoneLabel}</dt>
                  <dd className="mt-1.5 text-[0.9375rem] text-ink-muted">{site.phone || "—"}</dd>
                </div>
              </div>

              <div className="flex gap-5 py-5">
                <svg
                  viewBox="0 0 16 16"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden
                >
                  <rect x="1.5" y="3" width="13" height="10" />
                  <path d="M1.5 3.5L8 8.5l6.5-5" />
                </svg>
                <div>
                  <dt className="eyebrow text-ink-muted">{contactCopy.emailLabel}</dt>
                  <dd className="mt-1.5">
                    <a
                      href={`mailto:${site.email}`}
                      className="link-draw text-[0.9375rem] text-ink transition-colors hover:text-brand"
                    >
                      {site.email}
                    </a>
                  </dd>
                </div>
              </div>
            </dl>

            <h3 className="mt-12 font-display text-sm font-semibold uppercase tracking-[0.08em] text-ink">
              {contactCopy.mapTitle}
            </h3>
            <div className="mt-5 overflow-hidden border border-line">
              <iframe
                title={contactCopy.mapTitle}
                src="https://www.google.com/maps?q=Al%20Nahda%201%2C%20Dubai&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-72 w-full grayscale transition-all duration-500 hover:grayscale-0 lg:h-80"
              />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
