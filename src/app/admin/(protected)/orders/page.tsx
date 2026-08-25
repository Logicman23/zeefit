import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, OrderStatus } from "@/generated/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { aed } from "@/lib/format";
import { Card, EmptyState } from "@/components/admin/ui";
import OrderStatusPill from "@/components/admin/OrderStatusPill";

export const metadata: Metadata = {
  title: "Orders — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PER_PAGE = 25;
const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requirePermission("order:read");
  const sp = await searchParams;

  const status = STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { customerPhone: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, orders, counts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        reference: true,
        status: true,
        customerName: true,
        customerPhone: true,
        emirate: true,
        total: true,
        placedAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const countFor = (s: OrderStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;

  const href = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...next })) if (v) params.set(k, String(v));
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="mb-8 rule-tick relative pt-6">
        <h1 className="display text-3xl text-ink">Orders</h1>
        <p className="mt-2 text-[0.875rem] text-ink-muted">
          {total.toLocaleString()} order{total === 1 ? "" : "s"}
          {status && ` · ${status.toLowerCase()}`} · cash on delivery
        </p>
      </header>

      {/* Status filter doubles as a queue: pending is what needs a phone call. */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={href({ status: undefined, page: undefined })}
          className={`border px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
            !status ? "border-brand bg-brand text-paper" : "border-line bg-paper text-ink-soft hover:border-brand"
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={href({ status: s, page: undefined })}
            className={`border px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
              status === s ? "border-brand bg-brand text-paper" : "border-line bg-paper text-ink-soft hover:border-brand"
            }`}
          >
            {s.toLowerCase()} ({countFor(s)})
          </Link>
        ))}
      </div>

      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="min-w-[240px] flex-1">
            <label
              htmlFor="q"
              className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
            >
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Reference, customer name or phone"
              className="w-full rounded-[2px] border border-line bg-paper px-3 py-2.5 text-[0.875rem] outline-none focus:border-brand"
            />
          </div>
          <button
            type="submit"
            className="rounded-[2px] border border-line-strong bg-paper px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink hover:border-brand hover:text-brand"
          >
            Search
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState
            title={q || status ? "No matching orders" : "No orders yet"}
            description={
              q || status
                ? "Try a different search or status."
                : "Orders placed on the storefront will appear here."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-line bg-mist">
                  {["Reference", "Customer", "Emirate", "Items", "Total", "Status", "Placed"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft ${
                        h === "Total" || h === "Items" ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-mist/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="link-draw font-mono text-[0.8125rem] font-medium text-ink"
                      >
                        {o.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-[0.875rem] text-ink">{o.customerName}</span>
                      <a
                        href={`tel:${o.customerPhone}`}
                        className="text-[0.75rem] text-ink-muted hover:text-brand"
                      >
                        {o.customerPhone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-[0.8125rem] text-ink-soft">{o.emirate}</td>
                    <td className="px-4 py-3 text-right text-[0.8125rem] tabular-nums text-ink-soft">
                      {o._count.items}
                    </td>
                    <td className="px-4 py-3 text-right text-[0.875rem] font-semibold tabular-nums text-ink">
                      {aed(Number(o.total))}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusPill status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-[0.75rem] text-ink-muted">
                      <time dateTime={o.placedAt.toISOString()}>
                        {o.placedAt.toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <nav
            className="flex items-center justify-between gap-4 border-t border-line bg-mist px-4 py-3"
            aria-label="Pagination"
          >
            <p className="text-[0.75rem] text-ink-muted">
              Page {page} of {pageCount}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={href({ page: String(page - 1) })}
                  className="rounded-[2px] border border-line-strong bg-paper px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink hover:border-brand"
                >
                  ← Previous
                </Link>
              )}
              {page < pageCount && (
                <Link
                  href={href({ page: String(page + 1) })}
                  className="rounded-[2px] border border-line-strong bg-paper px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink hover:border-brand"
                >
                  Next →
                </Link>
              )}
            </div>
          </nav>
        )}
      </Card>
    </div>
  );
}
