"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductStatus } from "@/generated/prisma";
import { setProductStatus, deleteProduct } from "@/app/admin/(protected)/products/actions";

/**
 * Row actions. Which buttons render is driven by the caller's permissions, but
 * that is presentation only — setProductStatus and deleteProduct each re-check
 * on the server, so a hidden button is not what stops an Editor deleting.
 */
export default function ProductRowActions({
  id,
  legacyId,
  title,
  status,
  canPublish,
  canDelete,
}: {
  id: string;
  /**
   * The storefront still serves products from src/data/products.ts at
   * /product?id=<number>, so "View" is only offered for imported products that
   * have a legacy id. A product created here has nowhere public to point at
   * until the storefront reads from Postgres.
   */
  legacyId: number | null;
  title: string;
  status: ProductStatus;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const run = (fn: () => Promise<{ error?: string } | undefined>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-[0.75rem] text-ink-muted">Delete?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            run(() => deleteProduct(id));
            setConfirming(false);
          }}
          className="rounded-[2px] bg-alert px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-paper disabled:opacity-50"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-[2px] border border-line px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {error && (
        <span className="mr-2 max-w-[14rem] truncate text-[0.6875rem] text-alert" title={error} role="alert">
          {error}
        </span>
      )}

      <Link
        href={`/admin/products/${id}`}
        className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-brand transition-colors hover:bg-brand-50"
      >
        Edit
      </Link>

      {canPublish &&
        (status === "PUBLISHED" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setProductStatus(id, "DRAFT"))}
            className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:bg-haze disabled:opacity-50"
            title={`Move "${title}" back to draft`}
          >
            Draft
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setProductStatus(id, "PUBLISHED"))}
            className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:bg-haze disabled:opacity-50"
            title={`Publish "${title}"`}
          >
            Publish
          </button>
        ))}

      {status === "PUBLISHED" && legacyId !== null && (
        <a
          href={`/product?id=${legacyId}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:bg-haze"
        >
          View ↗
        </a>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted transition-colors hover:bg-alert/10 hover:text-alert"
        >
          Delete
        </button>
      )}
    </div>
  );
}
