"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Permission } from "@/lib/auth/permissions";

type NavItem = {
  href: string;
  label: string;
  /** Hidden unless the signed-in role holds this permission. */
  permission: Permission;
  icon: React.ReactNode;
};

/**
 * Nav is filtered by permission, so an Editor never sees Users or Settings.
 *
 * This is presentation only — hiding a link is a courtesy, not a control. The
 * routes themselves are gated server-side in lib/auth/guard.ts, so typing the
 * URL directly gets an Editor a 403 rather than a page.
 */
const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    permission: "product:read",
    icon: (
      <path d="M3 3h6v7H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 12h6v5H3z" />
    ),
  },
  {
    href: "/admin/products",
    label: "Products",
    permission: "product:read",
    icon: <path d="M10 2l7 4v8l-7 4-7-4V6zM3 6l7 4 7-4M10 10v8" fill="none" strokeWidth="1.5" stroke="currentColor" />,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    permission: "category:read",
    icon: <path d="M3 4h5l1.5 2H17v10H3zM3 8h14" fill="none" strokeWidth="1.5" stroke="currentColor" />,
  },
  {
    href: "/admin/users",
    label: "Users",
    permission: "user:read",
    icon: (
      <path
        d="M7 9a3 3 0 100-6 3 3 0 000 6zM2 17c0-2.8 2.2-5 5-5s5 2.2 5 5M14 12c2 0 4 1.8 4 4"
        fill="none"
        strokeWidth="1.5"
        stroke="currentColor"
      />
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    permission: "settings:read",
    icon: (
      <path
        d="M10 13a3 3 0 100-6 3 3 0 000 6zM10 2v2M10 16v2M18 10h-2M4 10H2M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4M15.7 15.7l-1.4-1.4M5.7 5.7L4.3 4.3"
        fill="none"
        strokeWidth="1.5"
        stroke="currentColor"
      />
    ),
  },
];

export default function Sidebar({ permissions }: { permissions: readonly Permission[] }) {
  const pathname = usePathname();
  const visible = NAV.filter((item) => permissions.includes(item.permission));

  return (
    <nav aria-label="Admin sections" className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-brand-700/40 px-6">
        <span className="display text-[1.0625rem] tracking-tight text-paper">ZEE FIT</span>
        <span className="eyebrow rounded-[2px] bg-signal/15 px-1.5 py-0.5 text-[0.5625rem] text-signal">
          Admin
        </span>
      </div>

      <ul className="flex-1 space-y-0.5 p-3">
        {visible.map((item) => {
          // /admin must match exactly or it stays lit on every child route.
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-[0.8125rem] font-medium transition-colors duration-200 ${
                  active
                    ? "bg-paper/10 text-paper"
                    : "text-brand-100/70 hover:bg-paper/5 hover:text-paper"
                }`}
              >
                <span
                  className={`h-4 w-0.5 shrink-0 transition-colors ${
                    active ? "bg-signal" : "bg-transparent"
                  }`}
                  aria-hidden
                />
                <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-brand-700/40 px-6 py-4 text-[0.6875rem] leading-relaxed text-brand-100/45">
        Signed-in role determines what appears here.
      </p>
    </nav>
  );
}
