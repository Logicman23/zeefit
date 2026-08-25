import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/data/content";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: site.title,
  description: site.metaDescription,
  keywords: site.metaKeywords,
};

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
