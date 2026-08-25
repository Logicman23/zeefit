"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma";
import type { Permission } from "@/lib/auth/permissions";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { signOut } from "@/app/admin/auth-actions";
import Sidebar from "./Sidebar";

type Staff = { email: string; fullName: string | null; role: Role };

export default function AdminShell({
  staff,
  permissions,
  children,
}: {
  staff: Staff;
  permissions: readonly Permission[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Navigating from inside the drawer should close it.
  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const initials =
    (staff.fullName ?? staff.email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="min-h-screen bg-mist">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] bg-brand-900 lg:block">
        <Sidebar permissions={permissions} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/50"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 left-0 w-[248px] bg-brand-900 shadow-2xl">
            <Sidebar permissions={permissions} />
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-paper/95 px-4 backdrop-blur-md lg:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            className="-ml-1 p-2 text-ink-soft transition-colors hover:text-brand lg:hidden"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
              <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          <div className="ml-auto flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-brand sm:inline"
            >
              View store ↗
            </a>

            <div className="h-6 w-px bg-line" aria-hidden />

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[0.8125rem] font-medium leading-tight text-ink">
                  {staff.fullName ?? staff.email}
                </p>
                {/* The role badge the brief asks for, read from Postgres each
                    request — not from the JWT claim, which can be an hour stale. */}
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-brand">
                  {ROLE_LABEL[staff.role]}
                </p>
              </div>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-brand text-[0.75rem] font-semibold text-paper"
                title={`${staff.email} — ${ROLE_LABEL[staff.role]}`}
              >
                {initials}
              </span>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="p-2 text-ink-muted transition-colors hover:text-alert"
                aria-label="Sign out"
                title="Sign out"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M8 17H4a1 1 0 01-1-1V4a1 1 0 011-1h4M13 14l4-4-4-4M17 10H8" />
                </svg>
              </button>
            </form>
          </div>
        </header>

        <main className="px-4 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
