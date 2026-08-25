import Link from "next/link";
import { Card } from "@/components/admin/ui";

/**
 * Rendered by forbidden() in lib/auth/guard.ts when a signed-in user reaches a
 * route their role does not cover — an Editor opening /admin/users, say.
 *
 * Deliberately a 403 and not a 404: the person is legitimately signed in, and
 * telling them "you lack permission" is more useful than pretending the page
 * does not exist. It names no detail about what lives behind the wall.
 */
export default function Forbidden() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <Card className="px-8 py-12 text-center">
        <span className="eyebrow text-alert">Error 403</span>
        <h1 className="display mt-4 text-3xl text-ink">Not your permission level</h1>
        <p className="mx-auto mt-4 max-w-sm text-[0.875rem] leading-relaxed text-ink-muted">
          Your account does not have access to this section. If you believe that is a mistake, ask
          an administrator to review your role.
        </p>
        <Link
          href="/admin"
          className="mt-8 inline-flex items-center gap-3 rounded-[2px] bg-brand px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-ink"
        >
          Back to dashboard
        </Link>
      </Card>
    </div>
  );
}
