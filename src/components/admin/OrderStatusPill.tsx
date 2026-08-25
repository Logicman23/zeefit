import type { OrderStatus } from "@/generated/prisma";

/**
 * Status is carried by a word as well as a colour — the fulfilment states are
 * not distinguishable by hue alone for a colourblind reader, and this is the
 * field someone scans a list by.
 */
const STYLES: Record<OrderStatus, string> = {
  PENDING: "border-warn/40 bg-warn/10 text-warn",
  CONFIRMED: "border-brand-200 bg-brand-50 text-brand-700",
  SHIPPED: "border-brand-400/40 bg-brand-50 text-brand",
  DELIVERED: "border-brand bg-brand text-paper",
  CANCELLED: "border-line bg-haze text-ink-muted",
};

const LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending call",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}

export { LABELS as ORDER_STATUS_LABELS };
