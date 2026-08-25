import type { NextConfig } from "next";

/**
 * next/image refuses any remote host that is not allow-listed, so images
 * uploaded to Supabase Storage would otherwise throw at render time. Derived
 * from the env var rather than hardcoded, so pointing the app at a different
 * Supabase project does not silently break every product photo.
 */
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? URL.canParse(process.env.NEXT_PUBLIC_SUPABASE_URL)
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : undefined
  : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  // Enables forbidden()/unauthorized() so a permission failure renders a real
  // 403 boundary instead of being flattened into a 404.
  experimental: { authInterrupts: true },
  // pg is a native-ish driver; keep it out of the server bundle trace.
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  // URL parity with the original PHP site: legacy .php URLs resolve to the new routes,
  // preserving every inbound link and the exact query-string routing model.
  async rewrites() {
    return [
      { source: "/index.php", destination: "/" },
      { source: "/product-category.php", destination: "/product-category" },
      { source: "/product.php", destination: "/product" },
      { source: "/search-result.php", destination: "/search-result" },
      { source: "/cart.php", destination: "/cart" },
      { source: "/checkout.php", destination: "/checkout" },
      { source: "/login.php", destination: "/login" },
      { source: "/forget-password.php", destination: "/forget-password" },
      { source: "/about.php", destination: "/about" },
      { source: "/faq.php", destination: "/faq" },
      { source: "/contact.php", destination: "/contact" },
    ];
  },
};

export default nextConfig;
