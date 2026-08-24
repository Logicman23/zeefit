# zeefit

A front-end rebuild of **zeefit.ae** — the original site's structure, sitemap, navigation
hierarchy and copy preserved exactly, with a completely new visual design.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS 4**.

---

## Design direction — "Clinical Performance"

Crisp white and deep clinical teal over graphite. Geometric sans display type
(Outfit) paired with Inter for body copy. Sharp 2px corners, hairline rules,
precise micro-interactions. The palette deliberately bridges the two halves of the
catalog: performance activewear and medical scrubs.

None of the original site's CSS, colours or theme were reused.

---

## Structural parity with the original

The rebuild reproduces the original architecture exactly:

| Aspect | Detail |
|---|---|
| Category tree | 3 top-level / 9 mid / **55 end** categories — same names, same order, same IDs |
| Navigation | 7 top-level items in original order, 3-level nested hierarchy |
| Routing | Same query-string model: `?id=&type=`, `/product?id=` |
| Legacy URLs | Every original `.php` URL still resolves via rewrites in `next.config.ts` |
| Header / footer | Copy reproduced word-for-word, including `Cart (AED0.00)` and the copyright line |
| Page copy | About, FAQ, Contact, product tabs, empty states — all verbatim |

Original typographic apostrophes (U+2019) and en-dashes are preserved byte-for-byte.

### Routes

```
/                                      Home
/product-category?id=&type=            Category listing (top / mid / end)
/product?id=                           Product detail
/search-result?search_text=            Search results
/cart            /checkout             Cart (checkout mirrors cart, as in the original)
/login           /forget-password      Customer account
/about  /faq  /contact                 Static pages
```

Legacy equivalents (`/index.php`, `/product-category.php?…`, `/product.php?id=…`, etc.)
rewrite to the routes above, so no inbound link breaks.

---

## Project structure

```
src/
  app/            One directory per route (App Router)
  components/     Header, MegaNav, MobileNav, ProductCard, CategorySidebar, ProductDetail, …
  data/
    catalog.ts    Generated category tree (3 / 9 / 55)
    products.ts   21 products with prices, sizes, colours, gallery, tab HTML
    content.ts    Verbatim copy from the original site
  lib/format.ts   AED price formatting
public/
  products/       Featured product imagery
  gallery/        Additional product photography
  brand/          Logo and hero video
```

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm start
```

---

## Notes on the original content

Four inconsistencies exist in the source site. Copy was reproduced as-is per the
content constraints; only the currency was normalised:

1. **Currency** — the original mixed `AED180` and `$150` for the same products.
   Normalised to **AED** throughout.
2. **Return policy** — the About page claims a *3-day* return window while the FAQ
   and the homepage badge both say *15 days*. All three reproduced verbatim.
3. **Phone number** — absent in both the footer and the Contact page in the original.
   Left unset in `src/data/content.ts` (`site.phone`).
4. **Support email** — `support@zeefit.com` on a `zeefit.ae` domain. Reproduced as found.

There is no registration page on the original site (`register.php` returns 404), yet
product reviews require login. That behaviour is mirrored rather than "fixed".
