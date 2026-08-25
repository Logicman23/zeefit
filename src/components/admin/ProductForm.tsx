"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { ProductStatus } from "@/generated/prisma";
import type { ProductActionState } from "@/app/admin/(protected)/products/actions";
import { slugify } from "@/lib/slug";
import { Section, Field, inputClass, Button, Card } from "./ui";
import RichTextEditor from "./RichTextEditor";
import ImageUploader from "./ImageUploader";
import SeoPreview, { CharCounter, SEO_TITLE_MAX, SEO_DESCRIPTION_MAX } from "./SeoPreview";

export type CategoryOption = { id: string; name: string; trail: string };

export type ProductDefaults = {
  id?: string;
  title: string;
  slug: string;
  sku: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  features: string;
  conditions: string;
  returnPolicy: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  stock: string;
  lowStockThreshold: string;
  trackInventory: boolean;
  weightGrams: string;
  primaryImage: string;
  gallery: string;
  sizes: string;
  colors: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  noIndex: boolean;
  status: ProductStatus;
  isFeatured: boolean;
};

export const EMPTY_PRODUCT: ProductDefaults = {
  title: "",
  slug: "",
  sku: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  features: "",
  conditions: "",
  returnPolicy: "",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  stock: "0",
  lowStockThreshold: "5",
  trackInventory: true,
  weightGrams: "",
  primaryImage: "",
  gallery: "",
  sizes: "",
  colors: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
  noIndex: false,
  status: "DRAFT",
  isFeatured: false,
};

export default function ProductForm({
  action,
  categories,
  siteUrl,
  defaults = EMPTY_PRODUCT,
  mode,
  canPublish,
}: {
  action: (state: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  categories: CategoryOption[];
  siteUrl: string;
  defaults?: ProductDefaults;
  mode: "create" | "edit";
  canPublish: boolean;
}) {
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(action, {});

  // Fields the SEO preview and the slug derivation need to watch live. Everything
  // else stays uncontrolled — the DOM holds it and FormData collects it on submit,
  // which keeps typing in a 30-field form from re-rendering the whole tree.
  const [title, setTitle] = useState(defaults.title);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(defaults.slug.length > 0);
  const [shortDescription, setShortDescription] = useState(defaults.shortDescription);
  const [seoTitle, setSeoTitle] = useState(defaults.seoTitle);
  const [seoDescription, setSeoDescription] = useState(defaults.seoDescription);
  const [noIndex, setNoIndex] = useState(defaults.noIndex);
  const [status, setStatus] = useState<ProductStatus>(defaults.status);

  const err = state.fieldErrors ?? {};

  // The slug follows the title until someone edits it by hand — after that it is
  // theirs, because a published slug is a URL people and Google already hold.
  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const grouped = useMemo(() => {
    const map = new Map<string, CategoryOption[]>();
    for (const c of categories) {
      const parent = c.trail.split(" › ").slice(0, -1).join(" › ");
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent)!.push(c);
    }
    return [...map.entries()];
  }, [categories]);

  return (
    <form action={formAction} className="mx-auto max-w-[1400px]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="rule-tick relative pt-6">
          <h1 className="display text-3xl text-ink">
            {mode === "create" ? "Add product" : "Edit product"}
          </h1>
          <p className="mt-2 text-[0.875rem] text-ink-muted">
            {mode === "create"
              ? "Everything below can be revised later. Nothing is public until the status says Published."
              : "Changes go live the moment you save a published product."}
          </p>
        </div>
        <Link href="/admin/products">
          <Button variant="ghost" type="button">
            ← All products
          </Button>
        </Link>
      </header>

      {state.error && (
        <p
          className="mb-6 rounded-[2px] border border-alert/30 bg-alert/5 px-4 py-3 text-[0.875rem] text-alert"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {err._form && (
        <p className="mb-6 rounded-[2px] border border-alert/30 bg-alert/5 px-4 py-3 text-[0.875rem] text-alert" role="alert">
          {err._form}
        </p>
      )}
      {state.ok && (
        <p className="mb-6 rounded-[2px] border border-brand-200 bg-brand-50 px-4 py-3 text-[0.875rem] text-brand-700" role="status">
          Saved.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          {/* ---------------------------------------------------- Basic info */}
          <Section step="01" title="Basic information" description="What the product is and where it lives.">
            <Field label="Product title" htmlFor="title" required error={err.title}>
              <input
                id="title"
                name="title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className={inputClass(!!err.title)}
                placeholder="Women's Professional Medical Scrub Set — Navy Blue"
                required
              />
            </Field>

            <Field
              label="URL slug"
              htmlFor="slug"
              required
              error={err.slug}
              hint={`Future product URL: /product/${slug || "your-slug"} — live once the storefront reads from the database.`}
            >
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                onBlur={(e) => setSlug(slugify(e.target.value))}
                className={inputClass(!!err.slug)}
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="SKU" htmlFor="sku" required error={err.sku} hint="Unique across the catalogue.">
                <input
                  id="sku"
                  name="sku"
                  defaultValue={defaults.sku}
                  className={inputClass(!!err.sku)}
                  placeholder="ZF-00083"
                  required
                />
              </Field>

              <Field label="Category" htmlFor="categoryId" required error={err.categoryId}>
                <select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={defaults.categoryId}
                  className={inputClass(!!err.categoryId)}
                  required
                >
                  <option value="">Choose a category…</option>
                  {grouped.map(([parent, options]) => (
                    <optgroup key={parent} label={parent}>
                      {options.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
            </div>

            <Field
              label="Short description"
              htmlFor="shortDescription"
              hint="One or two lines. Used on cards and as the SEO description fallback."
              error={err.shortDescription}
            >
              <textarea
                id="shortDescription"
                name="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
                className={inputClass(!!err.shortDescription)}
              />
            </Field>
          </Section>

          {/* ------------------------------------------ Pricing & inventory */}
          <Section step="02" title="Pricing & inventory" description="All amounts in AED.">
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Price" htmlFor="price" required error={err.price}>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={defaults.price}
                  className={inputClass(!!err.price)}
                  required
                />
              </Field>
              <Field
                label="Compare at"
                htmlFor="compareAtPrice"
                error={err.compareAtPrice}
                hint="Shown struck through."
              >
                <input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={defaults.compareAtPrice}
                  className={inputClass(!!err.compareAtPrice)}
                />
              </Field>
              <Field label="Cost" htmlFor="costPrice" error={err.costPrice} hint="Internal only.">
                <input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={defaults.costPrice}
                  className={inputClass(!!err.costPrice)}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Stock" htmlFor="stock" error={err.stock}>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={defaults.stock}
                  className={inputClass(!!err.stock)}
                />
              </Field>
              <Field label="Low stock at" htmlFor="lowStockThreshold" error={err.lowStockThreshold}>
                <input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={defaults.lowStockThreshold}
                  className={inputClass(!!err.lowStockThreshold)}
                />
              </Field>
              <Field label="Weight (g)" htmlFor="weightGrams" error={err.weightGrams}>
                <input
                  id="weightGrams"
                  name="weightGrams"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={defaults.weightGrams}
                  className={inputClass(!!err.weightGrams)}
                />
              </Field>
            </div>

            <Checkbox
              name="trackInventory"
              label="Track inventory for this product"
              hint="Off for made-to-order or untracked lines — the legacy catalogue carried no stock data, so imported products start untracked."
              defaultChecked={defaults.trackInventory}
            />
          </Section>

          {/* ------------------------------------------------- Rich content */}
          <Section
            step="03"
            title="Description"
            description="Formatting here renders exactly as it will on the product page."
          >
            <Field label="Full description" htmlFor="description" error={err.description}>
              <RichTextEditor
                name="description"
                defaultValue={defaults.description}
                placeholder="Describe the fabric, the fit, who it is for…"
                minHeight="14rem"
              />
            </Field>

            <Field label="Key features" htmlFor="features" error={err.features}>
              <RichTextEditor name="features" defaultValue={defaults.features} minHeight="9rem" />
            </Field>

            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Conditions & notes" htmlFor="conditions" error={err.conditions}>
                <RichTextEditor name="conditions" defaultValue={defaults.conditions} minHeight="8rem" />
              </Field>
              <Field label="Return policy" htmlFor="returnPolicy" error={err.returnPolicy}>
                <RichTextEditor name="returnPolicy" defaultValue={defaults.returnPolicy} minHeight="8rem" />
              </Field>
            </div>
          </Section>

          {/* -------------------------------------------- Media & variants */}
          <Section
            step="04"
            title="Media & options"
            description="Upload images, or point at existing paths on the site."
          >
            <Field
              label="Primary image"
              htmlFor="primaryImage"
              required
              error={err.primaryImage}
              hint="The one shown on cards and search results. Required to publish."
            >
              <ImageUploader
                name="primaryImage"
                defaultValue={defaults.primaryImage}
                label="Upload primary product image"
              />
            </Field>
            <Field
              label="Gallery"
              htmlFor="gallery"
              error={err.gallery}
              hint="Additional shots, shown on the product page."
            >
              <ImageUploader
                name="gallery"
                defaultValue={defaults.gallery}
                multiple
                label="Upload gallery images"
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Sizes" htmlFor="sizes" hint="S, M, L, XL, XXL">
                <input id="sizes" name="sizes" defaultValue={defaults.sizes} className={inputClass()} />
              </Field>
              <Field label="Colours" htmlFor="colors" hint="Navy, Blue">
                <input id="colors" name="colors" defaultValue={defaults.colors} className={inputClass()} />
              </Field>
            </div>
          </Section>

          {/* ---------------------------------------------------------- SEO */}
          <Section
            step="05"
            title="SEO optimisation"
            description="This is what a customer sees before they ever reach the page."
          >
            <SeoPreview
              siteUrl={siteUrl}
              slug={slug}
              seoTitle={seoTitle}
              seoDescription={seoDescription}
              fallbackTitle={title}
              fallbackDescription={shortDescription}
              noIndex={noIndex}
            />

            <Field
              label="Search title"
              htmlFor="seoTitle"
              error={err.seoTitle}
              counter={<CharCounter value={seoTitle} max={SEO_TITLE_MAX} />}
              hint="Lead with what it is. Leave blank to fall back to the product title."
            >
              <input
                id="seoTitle"
                name="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className={inputClass(!!err.seoTitle)}
                placeholder={title || "Women's Medical Scrub Set — Navy | Zee Fit"}
              />
            </Field>

            <Field
              label="Search description"
              htmlFor="seoDescription"
              error={err.seoDescription}
              counter={<CharCounter value={seoDescription} max={SEO_DESCRIPTION_MAX} />}
              hint="One sentence that earns the click. Blank falls back to the short description."
            >
              <textarea
                id="seoDescription"
                name="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className={inputClass(!!err.seoDescription)}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Focus keywords" htmlFor="seoKeywords" hint="scrub set, medical uniform">
                <input
                  id="seoKeywords"
                  name="seoKeywords"
                  defaultValue={defaults.seoKeywords}
                  className={inputClass()}
                />
              </Field>
              <Field
                label="Canonical URL"
                htmlFor="canonicalUrl"
                error={err.canonicalUrl}
                hint="Only when this duplicates another page."
              >
                <input
                  id="canonicalUrl"
                  name="canonicalUrl"
                  type="url"
                  defaultValue={defaults.canonicalUrl}
                  className={inputClass(!!err.canonicalUrl)}
                />
              </Field>
            </div>

            <Checkbox
              name="noIndex"
              label="Hide from search engines (noindex)"
              hint="Overrides everything above. Use for temporary or duplicate listings."
              defaultChecked={defaults.noIndex}
              onChange={setNoIndex}
            />
          </Section>
        </div>

        {/* ------------------------------------------------------ Publish rail */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-mist px-5 py-3.5">
              <h2 className="display text-[0.9375rem] text-ink">Visibility</h2>
            </div>
            <div className="space-y-4 p-5">
              <Field label="Status" htmlFor="status" error={err.status}>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className={inputClass(!!err.status)}
                >
                  <option value="DRAFT">Draft — not visible</option>
                  <option value="PUBLISHED" disabled={!canPublish}>
                    Published — live on the storefront
                  </option>
                  <option value="ARCHIVED">Archived — retired</option>
                </select>
              </Field>

              {!canPublish && (
                <p className="text-[0.75rem] leading-relaxed text-ink-muted">
                  Your role cannot publish. Save as a draft and ask an administrator to review it.
                </p>
              )}

              <Checkbox
                name="isFeatured"
                label="Feature on the homepage"
                defaultChecked={defaults.isFeatured}
              />

              <div className="border-t border-line pt-4">
                <Button type="submit" disabled={pending} className="w-full">
                  {pending
                    ? "Saving…"
                    : status === "PUBLISHED"
                      ? mode === "create"
                        ? "Publish product"
                        : "Save & keep live"
                      : "Save product"}
                </Button>
                <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-muted">
                  {status === "PUBLISHED"
                    ? "This will be visible to customers immediately."
                    : "Only staff can see this until it is published."}
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}

function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
  onChange,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded-[2px] border-line-strong text-brand accent-[var(--color-brand)]"
      />
      <span>
        <span className="block text-[0.8125rem] text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.75rem] leading-snug text-ink-muted">{hint}</span>}
      </span>
    </label>
  );
}
