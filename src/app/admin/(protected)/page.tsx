import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { aed } from "@/lib/format";
import { Card, StatusPill, Button } from "@/components/admin/ui";
import { StatTile, Meter } from "@/components/admin/StatTile";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const staff = await requirePermission("product:read");
  const showsAudit = can(staff.role, "audit:read");
  const lowStockAt = Number(await getSetting<number>("commerce.lowStockThreshold"));

  const [byStatus, categoryCount, lowStock, seoComplete, liveTotal, recent, activity] =
    await Promise.all([
      prisma.product.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.category.count({ where: { level: "END" } }),
      prisma.product.count({
        where: {
          deletedAt: null,
          trackInventory: true,
          status: { not: "ARCHIVED" },
          stock: { lte: lowStockAt },
        },
      }),
      prisma.product.count({
        where: {
          deletedAt: null,
          status: { not: "ARCHIVED" },
          seoTitle: { not: null },
          seoDescription: { not: null },
        },
      }),
      prisma.product.count({ where: { deletedAt: null, status: { not: "ARCHIVED" } } }),
      prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          status: true,
          updatedAt: true,
          category: { select: { name: true } },
          updatedBy: { select: { fullName: true, email: true } },
        },
      }),
      showsAudit
        ? prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
              id: true,
              action: true,
              entity: true,
              summary: true,
              actorEmail: true,
              actorRole: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

  const count = (s: "DRAFT" | "PUBLISHED" | "ARCHIVED") =>
    byStatus.find((r) => r.status === s)?._count._all ?? 0;

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="rule-tick relative pt-6">
        <h1 className="display text-3xl text-ink">Dashboard</h1>
        <p className="mt-2 text-[0.875rem] text-ink-muted">
          Signed in as {staff.fullName ?? staff.email}. You are seeing everything your role covers.
        </p>
      </header>

      {/* KPI row — stat tiles, not a grouped bar chart of four numbers. */}
      <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Catalogue summary">
        <StatTile
          label="Published"
          value={count("PUBLISHED")}
          tone="brand"
          note="Live on the storefront"
          href="/admin/products?status=PUBLISHED"
        />
        <StatTile
          label="Drafts"
          value={count("DRAFT")}
          note="Not yet visible to customers"
          href="/admin/products?status=DRAFT"
        />
        <StatTile
          label="Low stock"
          value={lowStock}
          tone={lowStock > 0 ? "warn" : "neutral"}
          note={`Tracked items at or below ${lowStockAt}`}
          href="/admin/products?sort=stock&dir=asc"
        />
        <StatTile label="Categories" value={categoryCount} note="Leaf categories in the tree" />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* SEO coverage — one ratio against a limit, so: a meter. */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="display text-[1.0625rem] text-ink">SEO coverage</h2>
          <p className="mt-1 text-[0.8125rem] text-ink-muted">
            Products carrying both a search title and description.
          </p>
          <div className="mt-6">
            <Meter label="Complete metadata" value={seoComplete} total={liveTotal} />
          </div>
          {seoComplete < liveTotal && (
            <Link
              href="/admin/products?seo=missing"
              className="link-draw mt-5 inline-block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brand"
            >
              Review {liveTotal - seoComplete} incomplete
            </Link>
          )}
        </Card>

        {/* Recently updated */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line bg-mist px-6 py-4">
            <h2 className="display text-[1.0625rem] text-ink">Recently updated</h2>
            <Link
              href="/admin/products"
              className="link-draw text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brand"
            >
              All products
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {recent.length === 0 && (
              <li className="px-6 py-10 text-center text-[0.875rem] text-ink-muted">
                Nothing here yet. Add your first product to get started.
              </li>
            )}
            {recent.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="link-draw block truncate text-[0.875rem] font-medium text-ink"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-0.5 truncate text-[0.75rem] text-ink-muted">
                    {p.category.name} · {aed(Number(p.price))}
                    {p.updatedBy && ` · by ${p.updatedBy.fullName ?? p.updatedBy.email}`}
                  </p>
                </div>
                <StatusPill status={p.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Audit trail — Admin only. With Editors publishing directly, this is the
          only record of who put what live. */}
      {showsAudit && (
        <Card className="mt-4 overflow-hidden">
          <div className="border-b border-line bg-mist px-6 py-4">
            <h2 className="display text-[1.0625rem] text-ink">Recent activity</h2>
            <p className="mt-1 text-[0.8125rem] text-ink-muted">
              Every catalogue change, with the account that made it.
            </p>
          </div>
          <ul className="divide-y divide-line">
            {activity.length === 0 && (
              <li className="px-6 py-10 text-center text-[0.875rem] text-ink-muted">
                No activity recorded yet.
              </li>
            )}
            {activity.map((log) => (
              <li key={log.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-6 py-3">
                <span className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-brand">
                  {log.action.toLowerCase().replace("_", " ")}
                </span>
                <span className="flex-1 text-[0.8125rem] text-ink-soft">
                  {log.summary ?? `${log.entity} changed`}
                </span>
                <span className="text-[0.75rem] text-ink-muted">
                  {log.actorEmail} ·{" "}
                  <time dateTime={log.createdAt.toISOString()}>
                    {log.createdAt.toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {can(staff.role, "product:create") && (
          <Link href="/admin/products/new">
            <Button>Add product</Button>
          </Link>
        )}
        <Link href="/admin/products">
          <Button variant="secondary">Manage catalogue</Button>
        </Link>
      </div>
    </div>
  );
}
