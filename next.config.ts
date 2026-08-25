import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
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
