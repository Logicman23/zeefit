import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: String(s["seo.title"]),
    description: String(s["seo.metaDescription"]),
    keywords: String(s["seo.metaKeywords"]),
    // A single switch that outranks every per-product SEO field, for a store
    // that is not open yet.
    robots: s["seo.noindexSite"] === true ? { index: false, follow: false } : undefined,
  };
}

/**
 * Deliberately bare: fonts, globals and the <body> flex column only.
 * Storefront chrome lives in (storefront)/layout.tsx; /admin brings its own shell.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
