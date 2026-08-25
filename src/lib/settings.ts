import "server-only";
import { prisma } from "./prisma";
import { site } from "@/data/content";

/**
 * Global settings.
 *
 * Every key here is READ by something on the storefront — a settings screen full
 * of fields that change nothing is worse than no settings screen, because it
 * implies control that does not exist. Defaults come from src/data/content.ts,
 * so an untouched install renders exactly what it renders today and the database
 * only holds what someone has deliberately changed.
 */

export type SettingType = "text" | "textarea" | "email" | "number" | "boolean";

export type SettingDef = {
  key: string;
  group: "store" | "seo" | "contact" | "commerce";
  label: string;
  type: SettingType;
  default: string | number | boolean;
  hint?: string;
  maxLength?: number;
  /** Where the value shows up, so the screen can say so. */
  usedBy: string;
};

export const SETTING_GROUPS = [
  { id: "store", title: "Store identity", description: "How the shop refers to itself." },
  { id: "seo", title: "Search & indexing", description: "Defaults for pages without their own metadata." },
  { id: "contact", title: "Contact details", description: "Shown in the footer and on the contact page." },
  { id: "commerce", title: "Commerce defaults", description: "Applied to new products." },
] as const;

export const SETTINGS: SettingDef[] = [
  {
    key: "store.name",
    group: "store",
    label: "Store name",
    type: "text",
    default: site.name,
    maxLength: 60,
    usedBy: "Header logo, accessible label",
  },
  {
    key: "seo.title",
    group: "seo",
    label: "Default page title",
    type: "text",
    default: site.title.trim(),
    maxLength: 60,
    usedBy: "Browser tab and search results for pages with no title of their own",
  },
  {
    key: "seo.metaDescription",
    group: "seo",
    label: "Default meta description",
    type: "textarea",
    default: site.metaDescription,
    maxLength: 160,
    usedBy: "Search snippet for pages with no description of their own",
  },
  {
    key: "seo.metaKeywords",
    group: "seo",
    label: "Meta keywords",
    type: "text",
    default: site.metaKeywords,
    maxLength: 255,
    hint: "Google has ignored this tag since 2009. Kept because the original site set it.",
    usedBy: "<meta name=keywords>",
  },
  {
    key: "seo.noindexSite",
    group: "seo",
    label: "Hide the entire site from search engines",
    type: "boolean",
    default: false,
    hint: "Overrides every per-product SEO setting. For a store that is not open yet.",
    usedBy: "Robots meta on every storefront page",
  },
  {
    key: "contact.email",
    group: "contact",
    label: "Support email",
    type: "email",
    default: site.email,
    usedBy: "Footer mailto link",
  },
  {
    key: "contact.phone",
    group: "contact",
    label: "Phone",
    type: "text",
    default: site.phone,
    maxLength: 40,
    usedBy: "Footer, when set",
  },
  {
    key: "contact.office",
    group: "contact",
    label: "Address",
    type: "text",
    default: site.office,
    maxLength: 160,
    usedBy: "Footer",
  },
  {
    key: "contact.copyright",
    group: "contact",
    label: "Copyright line",
    type: "text",
    default: site.copyright,
    maxLength: 160,
    usedBy: "Footer",
  },
  {
    key: "commerce.lowStockThreshold",
    group: "commerce",
    label: "Low stock threshold",
    type: "number",
    default: 5,
    hint: "Pre-filled on new products and used by the dashboard's low-stock count.",
    usedBy: "Add Product form, dashboard tile",
  },
];

export const SETTING_BY_KEY = new Map(SETTINGS.map((s) => [s.key, s]));

export type SettingsMap = Record<string, string | number | boolean>;

/**
 * Merges stored values over the defaults. A key absent from the database means
 * "never changed", not "empty" — which is why defaults live in code rather than
 * being written into the table at install time.
 */
export async function getSettings(): Promise<SettingsMap> {
  const stored = await prisma.setting.findMany({ select: { key: true, value: true } });
  const map: SettingsMap = {};
  for (const def of SETTINGS) map[def.key] = def.default;
  for (const row of stored) {
    if (!SETTING_BY_KEY.has(row.key)) continue; // ignore keys no longer defined
    map[row.key] = row.value as string | number | boolean;
  }
  return map;
}

/** Convenience for the handful of call sites that need one value. */
export async function getSetting<T extends string | number | boolean>(key: string): Promise<T> {
  const def = SETTING_BY_KEY.get(key);
  const row = await prisma.setting.findUnique({ where: { key }, select: { value: true } });
  return ((row?.value as T) ?? (def?.default as T)) as T;
}
