/* ==========================================================
   DUDU FOOD - central configuration
   Edit this file to update contact details, menu and photos.
   Anything left empty is hidden or shown as "coming soon".
   ========================================================== */
window.DUDU_CONFIG = {
  // WhatsApp number for orders: country code + number, digits only.
  // Example format: "91XXXXXXXXXX" (no +, spaces or dashes). Leave "" until verified.
  whatsappNumber: "",

  // Phone shown on the site, e.g. "+91 XXXXX XXXXX". Leave "" until verified.
  phoneDisplay: "",

  // Business hours, e.g. [{ days: "Mon - Sun", time: "11:00 AM - 10:00 PM" }]
  hours: [],

  // Social links (full https:// URLs). Empty ones are hidden.
  social: { instagram: "", facebook: "", youtube: "" },

  // Paste the Google Maps share link of the verified business location.
  // If empty, "Get directions" opens a Google Maps search for the area.
  mapsUrl: "",

  currency: "\u20B9",

  // Optional hero photo, e.g. "assets/images/hero.webp". Empty shows an illustration.
  heroImage: "",

  /* Menu. price: number (e.g. 120) or null while undecided ("Price TBA").
     category: "veg" or "nonveg".
     image: path such as "assets/images/veg-fried-rice.webp" (empty = illustration).
     art: illustration style used when there is no image.
     Add a dish by copying one block. Keep each id unique. */
  menu: [
    { id: "veg-fried-rice", name: "Veg Fried Rice", category: "veg", price: null,
      description: "A classic Indo-Chinese favourite, served hot.", image: "", art: "rice" },
    { id: "chicken-fried-rice", name: "Chicken Fried Rice", category: "nonveg", price: null,
      description: "Fried rice with chicken, a street-style staple.", image: "", art: "chickenRice" },
    { id: "gobi", name: "Gobi", category: "veg", price: null,
      description: "Crispy, bold and perfect for sharing.", image: "", art: "gobi" },
    { id: "chicken-gobi", name: "Chicken Gobi", category: "nonveg", price: null,
      description: "A hearty fast-food favourite with chicken.", image: "", art: "chickenGobi" },
    // Check the category below and change to "nonveg" if your Hakka Manchurian is not vegetarian.
    { id: "hakka-manchurian", name: "Hakka Manchurian", category: "veg", price: null,
      description: "Indo-Chinese Manchurian with a Hakka twist.", image: "", art: "manchurian" }
  ],

  // Showcase panels (menuId must match a menu id above).
  showcase: [
    { menuId: "veg-fried-rice", title: "Fried Rice", text: "Veg and chicken fried rice, made for hungry moments." },
    { menuId: "gobi", title: "Gobi", text: "Crispy Gobi, in veg and chicken styles." },
    { menuId: "hakka-manchurian", title: "Manchurian", text: "Hakka Manchurian with big Indo-Chinese flavour." }
  ],

  // Gallery photos. Add real photos of dishes you serve. Empty src shows an illustration.
  gallery: [
    { src: "", alt: "Veg fried rice", art: "rice" },
    { src: "", alt: "Chicken fried rice", art: "chickenRice" },
    { src: "", alt: "Gobi", art: "gobi" },
    { src: "", alt: "Chicken Gobi", art: "chickenGobi" },
    { src: "", alt: "Hakka Manchurian", art: "manchurian" },
    { src: "", alt: "Fried rice served hot", art: "rice" }
  ]
};
