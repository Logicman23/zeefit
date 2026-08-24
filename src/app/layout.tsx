import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import MegaNav from "@/components/MegaNav";
import Footer from "@/components/Footer";
import Newsletter from "@/components/Newsletter";
import ScrollTop from "@/components/ScrollTop";
import { site } from "@/data/content";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: site.title,
  description: site.metaDescription,
  keywords: site.metaKeywords,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header>
          <MegaNav />
        </Header>
        <main className="flex-1">{children}</main>
        <Newsletter />
        <Footer />
        <ScrollTop />
      </body>
    </html>
  );
}
