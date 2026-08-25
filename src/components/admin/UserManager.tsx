"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/generated/prisma";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import {
  createStaffUser,
  setStaffRole,
  setStaffActive,
  deleteStaffUser,
  resetStaffPassword,
  type UserActionState,
} from "@/app/admin/(protected)/users/actions";
import { Card, Section, Field, inputClass, Button, EmptyState } from "./ui";

export type StaffRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  productsTouched: number;
  isSelf: boolean;
};

export default function UserManager({
  users,
  activeAdmins,
}: {
  users: StaffRow[];
  activeAdmins: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<UserActionState | { error?: string } | undefined>) {
    setRowError(null);
    startTransition(async () => {
      const r = (await fn()) as UserActionState | undefined;
      if (r?.error) {
        setRowError(r.error);
        return;
      }
      if (r?.credentials) setCredentials(r.credentials);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="rule-tick relative pt-6">
          <h1 className="display text-3xl text-ink">Users</h1>
          <p className="mt-2 text-[0.875rem] text-ink-muted">
            {users.length} staff account{users.length === 1 ? "" : "s"} · {activeAdmins} active
            administrator{activeAdmins === 1 ? "" : "s"}.
          </p>
        </div>
        <Button type="button" onClick={() => setAdding((v) => !v)}>
          {adding ? "Close" : "Add staff account"}
        </Button>
      </header>

      {rowError && (
        <p
          className="mb-4 rounded-[2px] border border-alert/30 bg-alert/5 px-4 py-3 text-[0.875rem] text-alert"
          role="alert"
        >
          {rowError}
        </p>
      )}

      {credentials && (
        <CredentialsPanel credentials={credentials} onDismiss={() => setCredentials(null)} />
      )}

      {adding && (
        <div className="mb-4">
          <CreateUserForm
            onDone={(creds) => {
              setAdding(false);
              if (creds) setCredentials(creds);
              router.refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <Card className="overflow-hidden">
        {users.length === 0 ? (
          <EmptyState title="No staff accounts" description="Add one to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-line bg-mist">
                  {["Account", "Role", "Status", "Last seen", "Activity", ""].map((h, i) => (
                    <th
                      key={h + i}
                      className={`px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-soft ${
                        i === 5 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id} className={`transition-colors hover:bg-mist/60 ${u.isActive ? "" : "opacity-60"}`}>
                    <td className="px-4 py-3">
                      <span className="block text-[0.875rem] font-medium text-ink">
                        {u.fullName ?? u.email}
                        {u.isSelf && (
                          <span className="ml-2 rounded-[2px] bg-brand-50 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-brand">
                            You
                          </span>
                        )}
                      </span>
                      {u.fullName && (
                        <span className="mt-0.5 block text-[0.75rem] text-ink-muted">{u.email}</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {/* Changing your own role is refused server-side too —
                          this select is disabled as a courtesy, not a control. */}
                      <select
                        value={u.role}
                        disabled={u.isSelf || pending}
                        onChange={(e) => run(() => setStaffRole(u.id, e.target.value as Role))}
                        className="rounded-[2px] border border-line bg-paper px-2 py-1.5 text-[0.8125rem] outline-none focus:border-brand disabled:cursor-not-allowed disabled:bg-mist disabled:text-ink-muted"
                        title={u.isSelf ? "You cannot change your own role" : undefined}
                      >
                        <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
                        <option value="EDITOR">{ROLE_LABEL.EDITOR}</option>
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-[2px] border px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] ${
                          u.isActive
                            ? "border-brand-200 bg-brand-50 text-brand-700"
                            : "border-line bg-haze text-ink-muted"
                        }`}
                      >
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[0.75rem] text-ink-muted">
                      {u.lastSeenAt ? (
                        <time dateTime={u.lastSeenAt}>
                          {new Date(u.lastSeenAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </time>
                      ) : (
                        "Never signed in"
                      )}
                    </td>

                    <td className="px-4 py-3 text-[0.75rem] tabular-nums text-ink-muted">
                      {u.productsTouched} product{u.productsTouched === 1 ? "" : "s"}
                    </td>

                    <td className="px-4 py-3">
                      {confirmId === u.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[0.75rem] text-ink-muted">Delete permanently?</span>
                          <button
                            type="button"
                            onClick={() => {
                              run(() => deleteStaffUser(u.id));
                              setConfirmId(null);
                            }}
                            className="rounded-[2px] bg-alert px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-paper"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded-[2px] border border-line px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => resetStaffPassword(u.id))}
                            className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:bg-haze disabled:opacity-50"
                            title="Generate a new password for this account"
                          >
                            Reset password
                          </button>
                          {!u.isSelf && (
                            <>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => run(() => setStaffActive(u.id, !u.isActive))}
                                className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:bg-haze disabled:opacity-50"
                              >
                                {u.isActive ? "Disable" : "Enable"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmId(u.id)}
                                className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted transition-colors hover:bg-alert/10 hover:text-alert"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-4 text-[0.75rem] leading-relaxed text-ink-muted">
        Disabling an account revokes its sessions immediately and keeps its history. Deleting removes
        the login for good — the audit trail survives, because it records the email alongside the
        account rather than only pointing at it.
      </p>
    </div>
  );
}

/**
 * Shown once, after creation or a reset. The password is never stored anywhere
 * retrievable — if it is lost, the only route is another reset.
 */
function CredentialsPanel({
  credentials,
  onDismiss,
}: {
  credentials: { email: string; password: string };
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mb-4 rounded-[2px] border border-brand-200 bg-brand-50 p-5">
      <h2 className="display text-[1.0625rem] text-brand-900">Hand these over now</h2>
      <p className="mt-1 text-[0.8125rem] text-brand-700">
        This password is shown once and cannot be retrieved later. Send it through something other
        than email, and have them change it after signing in.
      </p>

      <dl className="mt-4 grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brand-700">
          Email
        </dt>
        <dd className="font-mono text-[0.875rem] text-ink">{credentials.email}</dd>
        <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brand-700">
          Password
        </dt>
        <dd className="font-mono text-[0.875rem] text-ink">{credentials.password}</dd>
      </dl>

      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            navigator.clipboard
              ?.writeText(`${credentials.email}\n${credentials.password}`)
              .then(() => setCopied(true))
              .catch(() => setCopied(false));
          }}
        >
          {copied ? "Copied" : "Copy both"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

function CreateUserForm({
  onDone,
  onCancel,
}: {
  onDone: (credentials?: { email: string; password: string }) => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(createStaffUser, {});
  const err = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok && !pending) onDone(state.credentials);
    // onDone is recreated by the parent each render; depending on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, pending]);

  return (
    <form action={formAction}>
      <Section
        title="New staff account"
        description="The account is created immediately with a generated password."
      >
        {state.error && (
          <p className="rounded-[2px] border border-alert/30 bg-alert/5 px-3 py-2.5 text-[0.8125rem] text-alert" role="alert">
            {state.error}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="new-email" required error={err.email}>
            <input
              id="new-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              className={inputClass(!!err.email)}
              placeholder="name@zeefit.ae"
            />
          </Field>

          <Field label="Full name" htmlFor="new-name" error={err.fullName}>
            <input
              id="new-name"
              name="fullName"
              autoComplete="off"
              className={inputClass(!!err.fullName)}
              placeholder="Optional"
            />
          </Field>
        </div>

        <Field
          label="Role"
          htmlFor="new-role"
          error={err.role}
          hint="Editors manage products but cannot delete them, manage users, or reach settings."
        >
          <select id="new-role" name="role" defaultValue="EDITOR" className={inputClass(!!err.role)}>
            <option value="EDITOR">{ROLE_LABEL.EDITOR}</option>
            <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
          </select>
        </Field>

        <div className="flex gap-3 border-t border-line pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Section>
    </form>
  );
}
