import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, ProductStatus } from "@/generated/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { aed } from "@/lib/format";
import { Card, Button, StatusPill, EmptyState } from "@/components/admin/ui";
import ProductRowActions from "@/components/admin/ProductRowActions";

export const metadata: Metadata = {
  title: "Products — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

/** Whitelist, not passthrough — an arbitrary ?sort= must never reach Prisma. */
const SORTABLE = {
  title: "title",
  price: "price",
  stock: "stock",
  status: "status",
  updatedAt: "updatedAt",
} as const;
type SortKey = keyof typeof SORTABLE;

type SearchParams = {
  page?: string;
  q?: string;
  status?: string;
  seo?: string;
  sort?: string;
  dir?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const staff = await requirePermission("product:read");
  const sp = await searchParams;

  const sort: SortKey = sp.sort && sp.sort in SORTABLE ? (sp.sort as SortKey) : "updatedAt";
  const dir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim();
  const statusFilter =
    sp.status === "DRAFT" || sp.status === "PUBLISHED" || sp.status === "ARCHIVED"
      ? (sp.status as ProductStatus)
      : undefined;

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(sp.seo === "missing"
      ? { OR: [{ seoTitle: null }, { seoDescription: null }] }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { [SORTABLE[sort]]: dir },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        legacyId: true,
        title: true,
        slug: true,
        sku: true,
        price: true,
        stock: true,
        trackInventory: true,
        lowStockThreshold: true,
        status: true,
        seoTitle: true,
        seoDescription: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const canPublish = can(staff.role, "product:publish");
  const canDelete = can(staff.role, "product:delete");

  /** Preserves every active filter when only one parameter changes. */
  const href = (next: Partial<SearchParams>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...next };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "") params.set(k, String(v));
    }
    const qs = params.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  };

  const sortHref = (key: SortKey) =>
    href({ sort: key, dir: sort === key && dir === "desc" ? "asc" : "desc", page: "1" });

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="rule-tick relative pt-6">
          <h1 className="display text-3xl text-ink">Products</h1>
          <p className="mt-2 text-[0.875rem] text-ink-muted">
            {total.toLocaleString()} {total === 1 ? "product" : "products"}
            {statusFilter && ` · ${statusFilter.toLowerCase()}`}
            {sp.seo === "missing" && " · incomplete SEO"}
          </p>
        </div>
        {can(staff.role, "product:create") && (
          <Link href="/admin/products/new">
            <Button>Add product</Button>
          </Link>
        )}
      </header>

      {/* Filters — one row above the table. */}
      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3" action="/admin/products">
          <div className="min-w-[220px] flex-1">
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
              placeholder="Title, SKU or slug"
              className="w-full rounded-[2px] border border-line bg-paper px-3 py-2.5 text-[0.875rem] outline-none focus:border-brand"
            />
          </div>
          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={sp.status ?? ""}
              className="rounded-[2px] border border-line bg-paper px-3 py-2.5 text-[0.875rem] outline-none focus:border-brand"
            >
              <option value="">All</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          {(q || sp.status || sp.seo) && (
            <Link href="/admin/products">
              <Button type="button" variant="ghost">
                Clear
              </Button>
            </Link>
          )}
        </form>
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="Nothing matches"
            description={
              q || statusFilter || sp.seo
                ? "No products match those filters. Try widening the search."
                : "Your catalogue is empty. Add a product or run the seed to import the existing one."
            }
            action={
              can(staff.role, "product:create") ? (
                <Link href="/admin/products/new">
                  <Button>Add product</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-line bg-mist">
                  <SortableTh label="Product" active={sort === "title"} dir={dir} href={sortHref("title")} />
                  <th className="px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Category
                  </th>
                  <SortableTh label="Price" align="right" active={sort === "price"} dir={dir} href={sortHref("price")} />
                  <SortableTh label="Stock" align="right" active={sort === "stock"} dir={dir} href={sortHref("stock")} />
                  <th className="px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    SEO
                  </th>
                  <SortableTh label="Status" active={sort === "status"} dir={dir} href={sortHref("status")} />
                  <SortableTh
                    label="Updated"
                    active={sort === "updatedAt"}
                    dir={dir}
                    href={sortHref("updatedAt")}
                  />
                  <th className="px-4 py-3 text-right text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => {
                  const seoComplete = Boolean(p.seoTitle && p.seoDescription);
                  const low = p.trackInventory && p.stock <= p.lowStockThreshold;

                  return (
                    <tr key={p.id} className="transition-colors hover:bg-mist/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="link-draw block max-w-[26rem] truncate text-[0.875rem] font-medium text-ink"
                        >
                          {p.title}
                        </Link>
                        <span className="mt-0.5 block text-[0.75rem] text-ink-muted">{p.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-[0.8125rem] text-ink-soft">{p.category.name}</td>
                      {/* tabular-nums here and only here: columns of digits must align. */}
                      <td className="px-4 py-3 text-right text-[0.8125rem] tabular-nums text-ink">
                        {aed(Number(p.price))}
                      </td>
                      <td className="px-4 py-3 text-right text-[0.8125rem] tabular-nums">
                        {p.trackInventory ? (
                          <span className={low ? "font-semibold text-warn" : "text-ink"}>{p.stock}</span>
                        ) : (
                          <span className="text-ink-muted" title="Inventory not tracked">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {/* Status carried by an icon + word, never colour alone. */}
                        {seoComplete ? (
                          <span className="text-[0.75rem] text-brand">✓ Complete</span>
                        ) : (
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="text-[0.75rem] text-warn underline-offset-2 hover:underline"
                          >
                            ! Incomplete
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-[0.75rem] text-ink-muted">
                        <time dateTime={p.updatedAt.toISOString()}>
                          {p.updatedAt.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </time>
                      </td>
                      <td className="px-4 py-3">
                        <ProductRowActions
                          id={p.id}
                          legacyId={p.legacyId}
                          title={p.title}
                          status={p.status}
                          canPublish={canPublish}
                          canDelete={canDelete}
                        />
                      </td>
                    </tr>
                  );
                })}
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
              Page {page} of {pageCount} · showing {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, total)} of {total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <PageLink href={href({ page: String(page - 1) })} disabled={page <= 1}>
                ← Previous
              </PageLink>
              <PageLink href={href({ page: String(page + 1) })} disabled={page >= pageCount}>
                Next →
              </PageLink>
            </div>
          </nav>
        )}
      </Card>
    </div>
  );
}

function SortableTh({
  label,
  href,
  active,
  dir,
  align = "left",
}: {
  label: string;
  href: string;
  active: boolean;
  dir: "asc" | "desc";
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] ${
        align === "right" ? "text-right" : "text-left"
      }`}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <Link
        href={href}
        className={`inline-flex items-center gap-1 transition-colors ${
          active ? "text-brand" : "text-ink-soft hover:text-ink"
        }`}
      >
        {label}
        <span aria-hidden className={active ? "opacity-100" : "opacity-30"}>
          {active && dir === "asc" ? "↑" : "↓"}
        </span>
      </Link>
    </th>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-[2px] border border-line px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-muted/50">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-[2px] border border-line-strong bg-paper px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-brand hover:text-brand"
    >
      {children}
    </Link>
  );
}
