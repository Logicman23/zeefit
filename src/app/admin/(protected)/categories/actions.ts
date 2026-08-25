"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth/guard";
import { categorySchema, categoryFieldErrors, PARENT_LEVEL } from "@/lib/validation/category";

export type CategoryActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};


/**
 * Purges the cached storefront. Publishing is worthless if the change waits out
 * an ISR window, so every catalogue mutation drops the whole storefront cache —
 * the navigation tree lives in the shared layout, so a single page purge would
 * leave a stale menu behind.
 */
function revalidateStorefront() {
  revalidatePath("/", "layout");
}

async function requestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

function uniqueViolation(e: unknown): Record<string, string> | null {
  const err = e as { code?: string; meta?: { target?: string[] | string } };
  if (err?.code !== "P2002") return null;
  const target = Array.isArray(err.meta?.target) ? err.meta.target.join(",") : String(err.meta?.target ?? "");
  if (target.includes("slug")) return { slug: "That slug is already in use." };
  return { _form: "A category with those details already exists." };
}

/**
 * Confirms the chosen parent exists and sits exactly one level up. Without this
 * an END category could be hung off a TOP, producing a two-level branch that the
 * storefront's three-tier navigation cannot render.
 */
async function validateParent(level: "TOP" | "MID" | "END", parentId: string | null) {
  const expected = PARENT_LEVEL[level];
  if (expected === null) return null;
  const parent = await prisma.category.findUnique({
    where: { id: parentId! },
    select: { id: true, level: true },
  });
  if (!parent) return { parentId: "That parent category no longer exists." };
  if (parent.level !== expected) {
    return { parentId: `A ${level.toLowerCase()} category must sit under a ${expected.toLowerCase()} category.` };
  }
  return null;
}

/**
 * legacyId is NOT NULL and unique per level because it reproduces the live
 * site's numeric ids. New categories created here get the next free number for
 * their level, so ?id=..&type=..-category keeps working for them too.
 */
async function nextLegacyId(level: "TOP" | "MID" | "END") {
  const max = await prisma.category.aggregate({
    where: { level },
    _max: { legacyId: true },
  });
  return (max._max.legacyId ?? 0) + 1;
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const auth = await authorize("category:write");
  if (!auth.ok) return { error: auth.error };

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: categoryFieldErrors(parsed.error) };

  const parentError = await validateParent(parsed.data.level, parsed.data.parentId);
  if (parentError) return { fieldErrors: parentError };

  try {
    const meta = await requestMeta();
    await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          legacyId: await nextLegacyId(parsed.data.level),
          level: parsed.data.level,
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          imageUrl: parsed.data.imageUrl,
          parentId: parsed.data.parentId,
          position: parsed.data.position,
          isActive: parsed.data.isActive,
          seoTitle: parsed.data.seoTitle,
          seoDescription: parsed.data.seoDescription,
          updatedById: auth.staff.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: auth.staff.id,
          actorEmail: auth.staff.email,
          actorRole: auth.staff.role,
          action: "CREATE",
          entity: "Category",
          entityId: created.id,
          summary: `Created ${created.level} category "${created.name}"`,
          ...meta,
        },
      });
    });
  } catch (e) {
    const conflict = uniqueViolation(e);
    if (conflict) return { fieldErrors: conflict };
    console.error("createCategory failed", e);
    return { error: "Could not create the category. Please try again." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products/new");
  revalidateStorefront();
  return { ok: true };
}

export async function updateCategory(
  id: string,
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const auth = await authorize("category:write");
  if (!auth.ok) return { error: auth.error };

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: categoryFieldErrors(parsed.error) };

  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, level: true },
  });
  if (!existing) return { error: "That category no longer exists." };

  // Changing level would orphan children and invalidate every product beneath.
  if (parsed.data.level !== existing.level) {
    return { fieldErrors: { level: "A category's level cannot be changed after creation." } };
  }
  if (parsed.data.parentId === id) {
    return { fieldErrors: { parentId: "A category cannot be its own parent." } };
  }

  const parentError = await validateParent(parsed.data.level, parsed.data.parentId);
  if (parentError) return { fieldErrors: parentError };

  try {
    const meta = await requestMeta();
    await prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          imageUrl: parsed.data.imageUrl,
          parentId: parsed.data.parentId,
          position: parsed.data.position,
          isActive: parsed.data.isActive,
          seoTitle: parsed.data.seoTitle,
          seoDescription: parsed.data.seoDescription,
          updatedById: auth.staff.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: auth.staff.id,
          actorEmail: auth.staff.email,
          actorRole: auth.staff.role,
          action: "UPDATE",
          entity: "Category",
          entityId: updated.id,
          summary: `Updated category "${updated.name}"`,
          ...meta,
        },
      });
    });
  } catch (e) {
    const conflict = uniqueViolation(e);
    if (conflict) return { fieldErrors: conflict };
    console.error("updateCategory failed", e);
    return { error: "Could not save your changes. Please try again." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products/new");
  revalidateStorefront();
  return { ok: true };
}

/**
 * Hard delete, gated on category:delete (ADMIN). Both foreign keys are
 * onDelete: Restrict, so the database would refuse anyway — but refusing here
 * first lets us say WHY, with counts, instead of surfacing a P2003.
 */
export async function deleteCategory(id: string) {
  const auth = await authorize("category:delete");
  if (!auth.ok) return { error: auth.error };

  const existing = await prisma.category.findUnique({
    where: { id },
    select: {
      name: true,
      level: true,
      _count: { select: { children: true, products: true } },
    },
  });
  if (!existing) return { error: "That category no longer exists." };

  if (existing._count.children > 0) {
    return {
      error: `"${existing.name}" still has ${existing._count.children} sub-categor${existing._count.children === 1 ? "y" : "ies"}. Remove or move those first.`,
    };
  }
  if (existing._count.products > 0) {
    return {
      error: `"${existing.name}" still holds ${existing._count.products} product${existing._count.products === 1 ? "" : "s"}. Move them to another category first.`,
    };
  }

  const meta = await requestMeta();
  await prisma.$transaction(async (tx) => {
    await tx.category.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        actorId: auth.staff.id,
        actorEmail: auth.staff.email,
        actorRole: auth.staff.role,
        action: "DELETE",
        entity: "Category",
        entityId: id,
        summary: `Deleted ${existing.level} category "${existing.name}"`,
        ...meta,
      },
    });
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products/new");
  revalidateStorefront();
  return { ok: true };
}

/** Quick visibility toggle from the tree, without opening the edit form. */
export async function toggleCategoryActive(id: string, isActive: boolean) {
  const auth = await authorize("category:write");
  if (!auth.ok) return { error: auth.error };

  const existing = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  if (!existing) return { error: "That category no longer exists." };

  const meta = await requestMeta();
  await prisma.$transaction(async (tx) => {
    await tx.category.update({ where: { id }, data: { isActive, updatedById: auth.staff.id } });
    await tx.auditLog.create({
      data: {
        actorId: auth.staff.id,
        actorEmail: auth.staff.email,
        actorRole: auth.staff.role,
        action: "UPDATE",
        entity: "Category",
        entityId: id,
        summary: `${isActive ? "Showed" : "Hid"} category "${existing.name}"`,
        ...meta,
      },
    });
  });

  revalidatePath("/admin/categories");
  revalidateStorefront();
  return { ok: true };
}
