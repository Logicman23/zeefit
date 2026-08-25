import HeroSlider, { type Slide } from "./HeroSlider";
import { hero } from "@/data/content";
import { getProductsInCategory } from "@/lib/storefront";
import { aed } from "@/lib/format";

/** Cheapest live price in a category, so slide copy can never go stale. */
async function from(id: number, type: string): Promise<string | null> {
  const items = await getProductsInCategory(id, type);
  if (!items.length) return null;
  return aed(Math.min(...items.map((p) => p.price)));
}

export default async function Hero() {
  const [medicalFrom, sportFrom, leggingsFrom] = await Promise.all([
    from(6, "top-category"),
    from(36, "end-category"),
    from(35, "end-category"),
  ]);

  const slides: Slide[] = [
    // Slide 1 — the original site's hero copy, reproduced word-for-word.
    {
      eyebrow: "Performance · Everyday · Medical",
      heading: hero.heading,
      sub: hero.sub,
      cta: { label: hero.cta, href: hero.ctaHref },
      altCta: { label: "Medical Apparel", href: "/product-category?id=6&type=top-category" },
      media: { type: "video", src: "/brand/hero.mp4", poster: "/products/product-featured-89.png" },
    },

    // Slide 2 — Medical & Healthcare Apparel department.
    {
      eyebrow: "Medical & Healthcare Apparel",
      heading: "Women’s Scrub Top & Pants Sets",
      sub: `Professional scrub sets and tops built for long shifts — breathable, easy-care fabric in navy, sky blue, pink and black.${
        medicalFrom ? ` From ${medicalFrom}.` : ""
      }`,
      cta: { label: "Shop Medical", href: "/product-category?id=6&type=top-category" },
      altCta: { label: "Scrub Tops", href: "/product-category?id=81&type=end-category" },
      media: { type: "image", src: "/gallery/149.png", fit: "contain", tone: "#ffffff" },
    },

    // Slide 3 — Women's Sportswear.
    {
      eyebrow: "Women · Sportswear",
      heading: "Performance Essentials",
      sub: `Sports bras, two-piece sets and high-waist leggings in seamless, camouflage and marble-print finishes.${
        sportFrom ? ` Sportswear from ${sportFrom}` : ""
      }${leggingsFrom ? `, leggings from ${leggingsFrom}` : ""}.`,
      cta: { label: "Shop Sportswear", href: "/product-category?id=36&type=end-category" },
      altCta: { label: "Pants & Leggings", href: "/product-category?id=35&type=end-category" },
      media: {
        type: "collage",
        images: ["/products/product-featured-96.png", "/products/product-featured-110.png", "/gallery/141.png"],
        tone: "#eef3f4",
      },
    },
  ];

  return <HeroSlider slides={slides} />;
}
