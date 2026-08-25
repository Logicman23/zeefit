"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma";
import { setOrderStatus } from "@/app/admin/(protected)/orders/actions";
import { Card, Button } from "./ui";
import { ORDER_STATUS_LABELS } from "./OrderStatusPill";

/**
 * The fulfilment path, in order. Cancelling is separated out because it is the
 * one transition that moves stock back, rather than moving the order forward.
 */
const FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

export default function OrderStatusControl({
  id,
  status,
}: {
  id: string;
  status: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const router = useRouter();

  function move(next: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const r = await setOrderStatus(id, next);
      if (r?.error) setError(r.error);
      else router.refresh();
    });
  }

  const index = FLOW.indexOf(status);
  const nextStep = index >= 0 && index < FLOW.length - 1 ? FLOW[index + 1] : null;
  const isClosed = status === "DELIVERED" || status === "CANCELLED";

  return (
    <Card className="p-6">
      <h2 className="display text-[1.0625rem] text-ink">Fulfilment</h2>

      {error && (
        <p className="mt-3 rounded-[2px] border border-alert/30 bg-alert/5 px-3 py-2 text-[0.8125rem] text-alert" role="alert">
          {error}
        </p>
      )}

      <ol className="mt-4 space-y-2">
        {FLOW.map((s, i) => {
          const done = index >= 0 && i <= index;
          return (
            <li key={s} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.625rem] font-semibold ${
                  done ? "border-brand bg-brand text-paper" : "border-line text-ink-muted"
                }`}
                aria-hidden
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-[0.8125rem] ${done ? "text-ink" : "text-ink-muted"}`}>
                {ORDER_STATUS_LABELS[s]}
              </span>
            </li>
          );
        })}
      </ol>

      {status === "CANCELLED" && (
        <p className="mt-4 border-t border-line pt-4 text-[0.8125rem] text-ink-muted">
          This order was cancelled and its stock returned to the catalogue.
        </p>
      )}

      {nextStep && (
        <div className="mt-5 border-t border-line pt-4">
          <Button type="button" disabled={pending} onClick={() => move(nextStep)} className="w-full">
            {pending ? "Saving…" : `Mark ${ORDER_STATUS_LABELS[nextStep].toLowerCase()}`}
          </Button>
        </div>
      )}

      {!isClosed && (
        <div className="mt-3">
          {confirmCancel ? (
            <div className="flex items-center gap-2">
              <span className="text-[0.75rem] text-ink-muted">Cancel and restock?</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  move("CANCELLED");
                  setConfirmCancel(false);
                }}
                className="rounded-[2px] bg-alert px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-paper"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="rounded-[2px] border border-line px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft"
              >
                No
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="danger"
              className="w-full"
              onClick={() => setConfirmCancel(true)}
            >
              Cancel order
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
