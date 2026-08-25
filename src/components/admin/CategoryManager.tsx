"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import { LEVEL_LABEL } from "@/lib/validation/category";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  type CategoryActionState,
} from "@/app/admin/(protected)/categories/actions";
import { Card, Section, Field, inputClass, Button, EmptyState } from "./ui";

export type Level = "TOP" | "MID" | "END";

export type CategoryNode = {
  id: string;
  legacyId: number;
  level: Level;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  position: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  childCount: number;
  productCount: number;
};

export default function CategoryManager({
  nodes,
  canWrite,
  canDelete,
}: {
  nodes: CategoryNode[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [adding, setAdding] = useState<{ level: Level; parentId: string | null } | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const byParent = useMemo(() => {
    const m = new Map<string | null, CategoryNode[]>();
    for (const n of nodes) {
      const k = n.parentId;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(n);
    }
    for (const list of m.values()) list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    return m;
  }, [nodes]);

  const tops = byParent.get(null) ?? [];
  const totals = {
    TOP: nodes.filter((n) => n.level === "TOP").length,
    MID: nodes.filter((n) => n.level === "MID").length,
    END: nodes.filter((n) => n.level === "END").length,
  };

  async function run(fn: () => Promise<{ error?: string } | undefined>) {
    setRowError(null);
    const r = await fn();
    if (r?.error) setRowError(r.error);
    else router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="rule-tick relative pt-6">
          <h1 className="display text-3xl text-ink">Categories</h1>
          <p className="mt-2 text-[0.875rem] text-ink-muted">
            {totals.TOP} top level · {totals.MID} sub-categories · {totals.END} product categories.
            Products attach to the third level.
          </p>
        </div>
        {canWrite && (
          <Button type="button" onClick={() => { setAdding({ level: "TOP", parentId: null }); setEditing(null); }}>
            Add top-level category
          </Button>
        )}
      </header>

      {!canWrite && (
        <p className="mb-4 rounded-[2px] border border-line bg-mist px-4 py-3 text-[0.8125rem] text-ink-soft">
          You have read-only access to categories. Ask an administrator to make changes.
        </p>
      )}

      {rowError && (
        <p className="mb-4 rounded-[2px] border border-alert/30 bg-alert/5 px-4 py-3 text-[0.875rem] text-alert" role="alert">
          {rowError}
        </p>
      )}

      {(adding || editing) && (
        <div className="mb-4">
          <CategoryForm
            key={editing?.id ?? `new-${adding?.level}-${adding?.parentId}`}
            node={editing}
            level={editing?.level ?? adding!.level}
            parentId={editing ? editing.parentId : adding!.parentId}
            nodes={nodes}
            onDone={() => { setEditing(null); setAdding(null); router.refresh(); }}
            onCancel={() => { setEditing(null); setAdding(null); }}
          />
        </div>
      )}

      <Card className="overflow-hidden">
        {tops.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Add a top-level category to begin building the tree."
          />
        ) : (
          <ul className="divide-y divide-line">
            {tops.map((top) => (
              <TreeRow
                key={top.id}
                node={top}
                byParent={byParent}
                depth={0}
                canWrite={canWrite}
                canDelete={canDelete}
                confirmId={confirmId}
                setConfirmId={setConfirmId}
                onEdit={(n) => { setEditing(n); setAdding(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                onAddChild={(level, parentId) => { setAdding({ level, parentId }); setEditing(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                onToggle={(n) => run(() => toggleCategoryActive(n.id, !n.isActive))}
                onDelete={(n) => run(() => deleteCategory(n.id))}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function TreeRow({
  node,
  byParent,
  depth,
  canWrite,
  canDelete,
  confirmId,
  setConfirmId,
  onEdit,
  onAddChild,
  onToggle,
  onDelete,
}: {
  node: CategoryNode;
  byParent: Map<string | null, CategoryNode[]>;
  depth: number;
  canWrite: boolean;
  canDelete: boolean;
  confirmId: string | null;
  setConfirmId: (id: string | null) => void;
  onEdit: (n: CategoryNode) => void;
  onAddChild: (level: Level, parentId: string) => void;
  onToggle: (n: CategoryNode) => void;
  onDelete: (n: CategoryNode) => void;
}) {
  const children = byParent.get(node.id) ?? [];
  const childLevel: Level | null = node.level === "TOP" ? "MID" : node.level === "MID" ? "END" : null;
  const confirming = confirmId === node.id;

  return (
    <li>
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-mist/60"
        style={{ paddingLeft: `${1 + depth * 1.5}rem` }}
      >
        <span
          className={`h-4 w-0.5 shrink-0 ${
            node.level === "TOP" ? "bg-brand" : node.level === "MID" ? "bg-brand-400" : "bg-line-strong"
          }`}
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <span className={`text-[0.875rem] ${node.isActive ? "text-ink" : "text-ink-muted line-through"}`}>
            {node.name}
          </span>
          <span className="ml-2 text-[0.6875rem] text-ink-muted">
            /{node.slug} · id {node.legacyId}
            {node.level === "END" && ` · ${node.productCount} product${node.productCount === 1 ? "" : "s"}`}
            {node.level !== "END" && ` · ${node.childCount} child${node.childCount === 1 ? "" : "ren"}`}
          </span>
        </div>

        {node.level === "END" && node.productCount > 0 && (
          <Link
            href={`/admin/products?q=${encodeURIComponent(node.name)}`}
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted hover:text-brand"
          >
            Products
          </Link>
        )}

        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-[0.75rem] text-ink-muted">Delete?</span>
            <button
              type="button"
              onClick={() => { onDelete(node); setConfirmId(null); }}
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
          canWrite && (
            <div className="flex items-center gap-1">
              {childLevel && (
                <button
                  type="button"
                  onClick={() => onAddChild(childLevel, node.id)}
                  className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-brand hover:bg-brand-50"
                  title={`Add a ${LEVEL_LABEL[childLevel].toLowerCase()} under ${node.name}`}
                >
                  + Sub
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(node)}
                className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft hover:bg-haze"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onToggle(node)}
                className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-soft hover:bg-haze"
                title={node.isActive ? "Hide from the storefront" : "Show on the storefront"}
              >
                {node.isActive ? "Hide" : "Show"}
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmId(node.id)}
                  className="rounded-[2px] px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted hover:bg-alert/10 hover:text-alert"
                >
                  Delete
                </button>
              )}
            </div>
          )
        )}
      </div>

      {children.length > 0 && (
        <ul className="divide-y divide-line border-t border-line bg-mist/30">
          {children.map((c) => (
            <TreeRow
              key={c.id}
              node={c}
              byParent={byParent}
              depth={depth + 1}
              canWrite={canWrite}
              canDelete={canDelete}
              confirmId={confirmId}
              setConfirmId={setConfirmId}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function CategoryForm({
  node,
  level,
  parentId,
  nodes,
  onDone,
  onCancel,
}: {
  node: CategoryNode | null;
  level: Level;
  parentId: string | null;
  nodes: CategoryNode[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const action = node ? updateCategory.bind(null, node.id) : createCategory;
  const [state, formAction, pending] = useActionState<CategoryActionState, FormData>(action, {});

  const [name, setName] = useState(node?.name ?? "");
  const [slug, setSlug] = useState(node?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(node));

  const err = state.fieldErrors ?? {};

  // Close on success from an effect, never during render — a render-phase call
  // would fire again on every re-render and update the parent mid-render.
  useEffect(() => {
    if (state.ok && !pending) onDone();
    // onDone is recreated each render by the parent; depending on it would
    // re-run this effect constantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, pending]);

  const parentLevel: Level | null = level === "MID" ? "TOP" : level === "END" ? "MID" : null;
  const parentOptions = parentLevel ? nodes.filter((n) => n.level === parentLevel) : [];

  return (
    <form action={formAction}>
      <Section
        step={level === "TOP" ? "01" : level === "MID" ? "02" : "03"}
        title={node ? `Edit "${node.name}"` : `New ${LEVEL_LABEL[level].toLowerCase()}`}
        description={
          level === "END"
            ? "Products attach to this level."
            : level === "MID"
              ? "Groups product categories together."
              : "The top of the navigation tree."
        }
      >
        <input type="hidden" name="level" value={level} />

        {state.error && (
          <p className="rounded-[2px] border border-alert/30 bg-alert/5 px-3 py-2.5 text-[0.8125rem] text-alert" role="alert">
            {state.error}
          </p>
        )}
        {err._form && (
          <p className="rounded-[2px] border border-alert/30 bg-alert/5 px-3 py-2.5 text-[0.8125rem] text-alert" role="alert">
            {err._form}
          </p>
        )}
        {err.level && (
          <p className="rounded-[2px] border border-alert/30 bg-alert/5 px-3 py-2.5 text-[0.8125rem] text-alert" role="alert">
            {err.level}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="cat-name" required error={err.name}>
            <input
              id="cat-name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className={inputClass(!!err.name)}
              placeholder="Scrub Sets"
              required
            />
          </Field>

          <Field label="Slug" htmlFor="cat-slug" required error={err.slug} hint="Used in the category URL.">
            <input
              id="cat-slug"
              name="slug"
              value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
              onBlur={(e) => setSlug(slugify(e.target.value))}
              className={inputClass(!!err.slug)}
              required
            />
          </Field>
        </div>

        {parentLevel && (
          <Field label={`Parent (${LEVEL_LABEL[parentLevel].toLowerCase()})`} htmlFor="cat-parent" required error={err.parentId}>
            <select
              id="cat-parent"
              name="parentId"
              defaultValue={parentId ?? ""}
              className={inputClass(!!err.parentId)}
              required
            >
              <option value="">Choose a parent…</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Position" htmlFor="cat-position" hint="Lower numbers appear first." error={err.position}>
            <input
              id="cat-position"
              name="position"
              type="number"
              min="0"
              defaultValue={node?.position ?? 0}
              className={inputClass(!!err.position)}
            />
          </Field>
          <Field label="Search title" htmlFor="cat-seo-title" error={err.seoTitle} hint="Max 60 characters.">
            <input
              id="cat-seo-title"
              name="seoTitle"
              defaultValue={node?.seoTitle ?? ""}
              maxLength={60}
              className={inputClass(!!err.seoTitle)}
            />
          </Field>
        </div>

        <Field label="Search description" htmlFor="cat-seo-desc" error={err.seoDescription} hint="Max 160 characters.">
          <textarea
            id="cat-seo-desc"
            name="seoDescription"
            rows={2}
            maxLength={160}
            defaultValue={node?.seoDescription ?? ""}
            className={inputClass(!!err.seoDescription)}
          />
        </Field>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={node?.isActive ?? true}
            className="mt-0.5 h-4 w-4 shrink-0 rounded-[2px] border-line-strong accent-[var(--color-brand)]"
          />
          <span>
            <span className="block text-[0.8125rem] text-ink">Visible on the storefront</span>
            <span className="mt-0.5 block text-[0.75rem] text-ink-muted">
              Hidden categories stay in the tree but disappear from navigation.
            </span>
          </span>
        </label>

        <div className="flex gap-3 border-t border-line pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : node ? "Save changes" : "Create category"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Section>
    </form>
  );
}
