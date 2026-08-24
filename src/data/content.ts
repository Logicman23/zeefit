/**
 * Verbatim copy lifted from zeefit.ae. Wording, punctuation and the original
 * typographic apostrophes are preserved exactly, per the content constraints.
 */

export const site = {
  name: "ZEE FIT",
  title: "ZEE FIT ",
  metaDescription: "online fashion store, garments shop, online garments",
  metaKeywords: "online fashion store, garments shop, online garments",
  email: "support@zeefit.com",
  phone: "",
  copyright: "Copyright © 2025 - Made by zeefit.ae",
  office: "Alnahda 1, Dubai",
};

export const hero = {
  heading: "Zee Fit – Style That Fits Every Life",
  sub: "Your online destination for men’s, women’s & children’s wear — plus trusted medical and healthcare apparel.",
  cta: "Shop Now",
  ctaHref: "/product-category?id=2&type=top-category",
  videoFallback: "Your browser does not support the video tag.",
};

export const services = [
  { title: "Easy Returns", text: "Return any item before 15 days!" },
  { title: "Free Shipping", text: "Enjoy free shipping inside UAE" },
  { title: "Fast Shipping", text: "Items are shipped within 24 hours." },
  { title: "Satisfaction Guarantee", text: "We guarantee you with our quality satisfaction." },
  { title: "Secure Checkout", text: "Providing Secure Checkout Options for all" },
  { title: "Money Back Guarantee", text: "Offer money back guarantee on our products" },
];

export const homeSections = {
  featured: { title: "Featured Products", sub: "Our list on Top Featured Products" },
  latest: { title: "Latest Products", sub: "Our list of recently added products" },
  popular: { title: "Popular Products", sub: "Popular products based on customer's choice" },
};

export const newsletter = {
  heading: "Subscribe To Our Newsletter",
  placeholder: "Enter Your Email Address",
  button: "Subscribe",
};

export const aboutCopy = {
  heading: "About Us",
  paragraphs: [
    "At Zee Fit , fashion is more than just clothes – it’s a way to express who you are. We started with a simple vision: to bring trendy, high-quality, and affordable fashion to men and women who want to look great and feel confident every day. From men’s accessories, shoes, bottoms, t-shirts & shirts to women’s beauty products, accessories, shoes, and clothing , every piece in our collection is carefully chosen with love and attention to detail.",
    "Our journey is guided by a single principle: you come first . We pay close attention to the latest trends and listen to our customers’ wishes, so we can bring styles that inspire and delight. Shopping with Zee Fit is easy and worry-free – we offer worldwide shipping, a 3-day hassle-free return policy, and Norton-verified secure payments .",
    "But Zee Fit is more than just products. It’s about the confidence that comes when you wear something you love, the joy of discovering a new favorite outfit, and the comfort of knowing you’re supported every step of the way.",
    "We invite you to explore our collections, embrace your unique style, and become a part of the Zee Fit family – where fashion meets passion, and every outfit tells a story… yours .",
  ],
};

export const faq: { q: string; blocks: ({ type: "p"; text: string } | { type: "ul"; items: string[] })[] }[] = [
  {
    q: "Q: How to find an item?",
    blocks: [
      { type: "p", text: "We have a wide range of fabulous products to choose from." },
      { type: "p", text: "Tip 1: If you're looking for a specific product, use the keyword search box located at the top of the site. Simply type what you are looking for, and prepare to be amazed!" },
      { type: "p", text: "Tip 2: If you want to explore a category of products, use the Shop Categories in the upper menu, and navigate through your favorite categories where we'll feature the best products in each." },
    ],
  },
  {
    q: "Q: What is your return policy?",
    blocks: [{ type: "p", text: "You have 15 days to make a refund request after your order has been delivered." }],
  },
  {
    q: "Q: I received a defective/damaged item, can I get a refund?",
    blocks: [{ type: "p", text: "In case the item you received is damaged or defective, you could return an item in the same condition as you received it with the original box and/or packaging intact. Once we receive the returned item, we will inspect it and if the item is found to be defective or damaged, we will process the refund along with any shipping fees incurred." }],
  },
  {
    q: "Q: When are ‘Returns’ not possible?",
    blocks: [
      { type: "p", text: "There are a few certain scenarios where it is difficult for us to support returns:" },
      {
        type: "ul",
        items: [
          "Return request is made outside the specified time frame, of 15 days from delivery.",
          "Product is used, damaged, or is not in the same condition as you received it.",
          "Specific categories like innerwear, lingerie, socks and clothing freebies etc.",
          "Defective products which are covered under the manufacturer's warranty.",
          "Any consumable item which has been used or installed.",
          "Products with tampered or missing serial numbers.",
          "Anything missing from the package you've received including price tags, labels, original packing, freebies and accessories.",
          "Fragile items, hygiene related items.",
        ],
      },
    ],
  },
  {
    q: "Q: What are the items that cannot be returned?",
    blocks: [
      { type: "p", text: "The items that can not be returned are:" },
      {
        type: "ul",
        items: [
          "Clearance items clearly marked as such and displaying a No-Return Policy",
          "When the offer notes states so specifically are items that cannot be returned.",
          "Items that fall into the below product types-",
        ],
      },
      {
        type: "ul",
        items: ["Underwear", "Lingerie", "Socks", "Software", "Music albums", "Books", "Swimwear", "Beauty & Fragrances", "Hosiery"],
      },
      { type: "p", text: "Also, any consumable items that are used or installed cannot be returned. As outlined in consumer Protection Rights and concerning section on non-returnable items" },
    ],
  },
];

export const contactCopy = {
  heading: "Contact Us",
  formTitle: "Contact Form",
  fields: { name: "Name", email: "Email Address", phone: "Phone Number", message: "Message" },
  officeTitle: "Our office",
  address: "Alnahda 1, Dubai",
  phoneLabel: "Phone:",
  emailLabel: "Email:",
  mapTitle: "Find Us On Map",
};
