import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { aed } from "@/lib/format";
import { Card, Button } from "@/components/admin/ui";
import OrderStatusPill from "@/components/admin/OrderStatusPill";
import OrderStatusControl from "@/components/admin/OrderStatusControl";

export const metadata: Metadata = {
  title: "Order — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requirePermission("order:read");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { titleSnapshot: "asc" } },
      handledBy: { select: { fullName: true, email: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="rule-tick relative pt-6">
          <h1 className="display font-mono text-3xl text-ink">{order.reference}</h1>
          <p className="mt-2 text-[0.875rem] text-ink-muted">
            Placed{" "}
            <time dateTime={order.placedAt.toISOString()}>
              {order.placedAt.toLocaleString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>{" "}
            · Cash on delivery
            {order.handledBy && ` · last handled by ${order.handledBy.fullName ?? order.handledBy.email}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusPill status={order.status} />
          <Link href="/admin/orders">
            <Button variant="ghost" type="button">
              ← All orders
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-mist px-6 py-4">
              <h2 className="display text-[1.0625rem] text-ink">Items</h2>
            </div>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    {/* The snapshot is what was agreed. The link is a convenience
                        and may point at a product that has since changed. */}
                    <Link
                      href={`/product/${i.slugSnapshot}`}
                      target="_blank"
                      rel="noreferrer"
                      className="link-draw block truncate text-[0.875rem] font-medium text-ink"
                    >
                      {i.titleSnapshot}
                    </Link>
                    <p className="mt-0.5 text-[0.75rem] text-ink-muted">
                      {i.skuSnapshot}
                      {(i.size || i.color) && ` · ${[i.size, i.color].filter(Boolean).join(" · ")}`}
                    </p>
                  </div>
                  <span className="text-[0.8125rem] tabular-nums text-ink-muted">
                    {aed(Number(i.unitPrice))} × {i.qty}
                  </span>
                  <span className="w-24 text-right text-[0.875rem] font-semibold tabular-nums text-ink">
                    {aed(Number(i.lineTotal))}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-line bg-mist px-6 py-4 text-[0.875rem]">
              <div className="flex justify-between">
                <span className="text-ink-muted">Subtotal</span>
                <span className="tabular-nums text-ink">{aed(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Shipping</span>
                <span className="tabular-nums text-ink">
                  {Number(order.shipping) === 0 ? "Free" : aed(Number(order.shipping))}
                </span>
              </div>
              <div className="flex justify-between border-t border-line-strong pt-2">
                <span className="font-display font-semibold text-ink">Total to collect</span>
                <span className="font-display text-lg font-semibold tabular-nums text-ink">
                  {aed(Number(order.total))}
                </span>
              </div>
            </div>
          </Card>

          {order.notes && (
            <Card className="p-6">
              <h2 className="display text-[1.0625rem] text-ink">Delivery notes</h2>
              <p className="mt-2 whitespace-pre-line text-[0.875rem] leading-relaxed text-ink-soft">
                {order.notes}
              </p>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-6">
            <h2 className="display text-[1.0625rem] text-ink">Customer</h2>
            <dl className="mt-4 space-y-3 text-[0.875rem]">
              <div>
                <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Name
                </dt>
                <dd className="text-ink">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Phone
                </dt>
                <dd>
                  <a href={`tel:${order.customerPhone}`} className="link-draw text-brand">
                    {order.customerPhone}
                  </a>
                </dd>
              </div>
              {order.customerEmail && (
                <div>
                  <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Email
                  </dt>
                  <dd>
                    <a href={`mailto:${order.customerEmail}`} className="link-draw text-brand">
                      {order.customerEmail}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Deliver to
                </dt>
                <dd className="leading-relaxed text-ink-soft">
                  {order.addressLine1}
                  {order.addressLine2 && (
                    <>
                      <br />
                      {order.addressLine2}
                    </>
                  )}
                  <br />
                  {order.city}, {order.emirate}
                </dd>
              </div>
            </dl>
          </Card>

          {can(staff.role, "order:write") && (
            <OrderStatusControl id={order.id} status={order.status} />
          )}
        </aside>
      </div>
    </div>
  );
}
