// Generated from zeefit.ae — category tree reproduced exactly (3 top / 9 mid / 55 end).
export type EndCategory = { id: number; name: string };
export type MidCategory = { id: number; name: string; children: EndCategory[] };
export type TopCategory = { id: number; name: string; children: MidCategory[] };

export const catalog: TopCategory[] = [
  {
    "id": 1,
    "name": "Men",
    "children": [
      {
        "id": 1,
        "name": "Men Accessories",
        "children": [
          {
            "id": 1,
            "name": "Headwear"
          },
          {
            "id": 2,
            "name": "Sunglasses"
          },
          {
            "id": 3,
            "name": "Watches"
          },
          {
            "id": 57,
            "name": "Belts"
          },
          {
            "id": 58,
            "name": "Multipacks"
          },
          {
            "id": 59,
            "name": "Other Accessories"
          }
        ]
      },
      {
        "id": 2,
        "name": "Men's Shoes",
        "children": [
          {
            "id": 4,
            "name": "Sandals"
          },
          {
            "id": 5,
            "name": "Boots"
          },
          {
            "id": 11,
            "name": "Sports Shoes"
          },
          {
            "id": 25,
            "name": "Casual Shoes"
          },
          {
            "id": 56,
            "name": "Formal Shoes"
          }
        ]
      },
      {
        "id": 8,
        "name": "Bottoms",
        "children": [
          {
            "id": 16,
            "name": "Pants"
          },
          {
            "id": 17,
            "name": "Jeans"
          },
          {
            "id": 18,
            "name": "Joggers"
          },
          {
            "id": 19,
            "name": "Shorts"
          }
        ]
      },
      {
        "id": 9,
        "name": "T-shirts & Shirts",
        "children": [
          {
            "id": 20,
            "name": "T-shirts"
          },
          {
            "id": 21,
            "name": "Casual Shirts"
          },
          {
            "id": 22,
            "name": "Formal Shirts"
          },
          {
            "id": 23,
            "name": "Polo Shirts"
          },
          {
            "id": 24,
            "name": "Vests"
          }
        ]
      }
    ]
  },
  {
    "id": 2,
    "name": "Women",
    "children": [
      {
        "id": 3,
        "name": "Beauty Products",
        "children": [
          {
            "id": 6,
            "name": "Tops"
          },
          {
            "id": 7,
            "name": "T-Shirt"
          },
          {
            "id": 39,
            "name": "Fragrance"
          },
          {
            "id": 40,
            "name": "Skincare"
          },
          {
            "id": 41,
            "name": "Hair Care"
          },
          {
            "id": 43,
            "name": "Eyes Care"
          },
          {
            "id": 44,
            "name": "Lips"
          },
          {
            "id": 45,
            "name": "Face Care"
          },
          {
            "id": 46,
            "name": "Gift Sets"
          }
        ]
      },
      {
        "id": 4,
        "name": "Accessories",
        "children": [
          {
            "id": 8,
            "name": "Watches"
          },
          {
            "id": 9,
            "name": "Sunglasses"
          },
          {
            "id": 42,
            "name": "Jewellery"
          },
          {
            "id": 47,
            "name": "Scarves & Headwear"
          },
          {
            "id": 48,
            "name": "Multipacks"
          },
          {
            "id": 49,
            "name": "Other Accessories"
          },
          {
            "id": 60,
            "name": "Bags"
          }
        ]
      },
      {
        "id": 6,
        "name": "Shoes",
        "children": [
          {
            "id": 12,
            "name": "Sandals"
          },
          {
            "id": 13,
            "name": "Flat Shoes"
          },
          {
            "id": 50,
            "name": "Pumps"
          },
          {
            "id": 51,
            "name": "Sneakers"
          },
          {
            "id": 52,
            "name": "Sports Shoes"
          },
          {
            "id": 53,
            "name": "Boots"
          },
          {
            "id": 54,
            "name": "Comfort Shoes"
          },
          {
            "id": 55,
            "name": "Slippers & Casual Shoes"
          }
        ]
      },
      {
        "id": 7,
        "name": "Clothing",
        "children": [
          {
            "id": 14,
            "name": "Hoodies"
          },
          {
            "id": 15,
            "name": "Coats & Jackets"
          },
          {
            "id": 32,
            "name": "Dresses"
          },
          {
            "id": 33,
            "name": "Tops"
          },
          {
            "id": 34,
            "name": "T-Shirts & Vests"
          },
          {
            "id": 35,
            "name": "Pants & Leggings"
          },
          {
            "id": 36,
            "name": "Sportswear"
          },
          {
            "id": 37,
            "name": "Plus Size Clothing"
          },
          {
            "id": 38,
            "name": "Socks & Hosiery"
          }
        ]
      }
    ]
  },
  {
    "id": 6,
    "name": "Medical & Healthcare Apparel",
    "children": [
      {
        "id": 18,
        "name": "Women’s Medical Wear",
        "children": [
          {
            "id": 80,
            "name": "Women’s Scrub Top & Pants Sets"
          },
          {
            "id": 81,
            "name": "Women’s Scrub Top"
          }
        ]
      }
    ]
  }
];

export const staticLinks = [
  { label: "About Us", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

export function categoryHref(id: number, type: "top-category" | "mid-category" | "end-category") {
  return `/product-category?id=${id}&type=${type}`;
}

export function findCategory(id: number, type: string) {
  for (const top of catalog) {
    if (type === "top-category" && top.id === id) return { name: top.name, trail: [top.name] };
    for (const mid of top.children) {
      if (type === "mid-category" && mid.id === id) return { name: mid.name, trail: [top.name, mid.name] };
      for (const end of mid.children) {
        if (type === "end-category" && end.id === id) return { name: end.name, trail: [top.name, mid.name, end.name] };
      }
    }
  }
  return null;
}
