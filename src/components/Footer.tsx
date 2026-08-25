import { getSettings } from "@/lib/settings";

/**
 * The original footer carried exactly three things: an email, a phone icon with no
 * number, and the copyright line. All are reproduced word-for-word; nothing invented.
 */
export default async function Footer() {
  const s = await getSettings();
  const email = String(s["contact.email"]);
  const phone = String(s["contact.phone"] ?? "");
  const office = String(s["contact.office"] ?? "");

  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="flex flex-col gap-6 text-[0.8125rem] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <span className="flex items-center gap-2.5">
              <svg viewBox="0 0 16 16" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M2.5 3.5c0 5.5 4.5 10 10 10l1.5-2.5-3-1.5-1.5 1.5A11 11 0 0 1 5 8L6.5 6.5 5 3.5z" />
              </svg>
              {/* The original footer carried a phone icon with no number.
                  It renders one now if the setting is filled in. */}
              {phone ? (
                <a href={`tel:${phone.replace(/s+/g, "")}`} className="link-draw text-ink-soft transition-colors hover:text-brand">
                  {phone}
                </a>
              ) : (
                <span className="sr-only">Phone</span>
              )}
            </span>
            <a href={`mailto:${email}`} className="link-draw flex items-center gap-2.5 text-ink-soft transition-colors hover:text-brand">
              <svg viewBox="0 0 16 16" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <rect x="1.5" y="3" width="13" height="10" />
                <path d="M1.5 3.5L8 8.5l6.5-5" />
              </svg>
              {email}
            </a>
          </div>

          <div className="text-ink-muted">
            {office && <p>{office}</p>}
            <p>{String(s["contact.copyright"])}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
