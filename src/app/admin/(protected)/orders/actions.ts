"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { OrderStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth/guard";

/**
 * Cancelling returns stock that was decremented when the order was placed.
 * Any other transition only moves the order along the fulfilment path.
 */
export async function setOrderStatus(id: string, status: OrderStatus) {
  const auth = await authorize("order:write");
  if (!auth.ok) return { error: auth.error };

  const existing = await prisma.order.findUnique({
    where: { id },
    select: {
      reference: true,
      status: true,
      items: { select: { productId: true, qty: true } },
    },
  });
  if (!existing) return { error: "That order no longer exists." };
  if (existing.status === status) return { ok: true };

  // Delivered is the end of the line: reversing it would put stock back for
  // goods that are already in a customer's hands.
  if (existing.status === "DELIVERED" && status !== "DELIVERED") {
    return { error: "A delivered order cannot be reopened. Record a return instead." };
  }

  const cancelling = status === "CANCELLED" && existing.status !== "CANCELLED";
  const uncancelling = existing.status === "CANCELLED" && status !== "CANCELLED";

  const h = await headers();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status, handledById: auth.staff.id },
      });

      if (cancelling) {
        for (const i of existing.items) {
          if (!i.productId) continue;
          await tx.product.updateMany({
            where: { id: i.productId, trackInventory: true },
            data: { stock: { increment: i.qty } },
          });
        }
      }

      if (uncancelling) {
        // Re-opening takes the stock back out, and must fail rather than allow
        // a negative count if it has since been sold to someone else.
        for (const i of existing.items) {
          if (!i.productId) continue;
          const updated = await tx.product.updateMany({
            where: { id: i.productId, trackInventory: true, stock: { gte: i.qty } },
            data: { stock: { decrement: i.qty } },
          });
          const tracked = await tx.product.count({
            where: { id: i.productId, trackInventory: true },
          });
          if (tracked > 0 && updated.count === 0) throw new Error("INSUFFICIENT_STOCK");
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: auth.staff.id,
          actorEmail: auth.staff.email,
          actorRole: auth.staff.role,
          action: "UPDATE",
          entity: "Order",
          entityId: id,
          summary: `Order ${existing.reference}: ${existing.status} -> ${status}`,
          diff: { status: { from: existing.status, to: status } },
          ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
          userAgent: h.get("user-agent"),
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") {
      return { error: "Cannot reopen: there is no longer enough stock to fulfil this order." };
    }
    console.error("setOrderStatus failed", e);
    return { error: "Could not update that order." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}
