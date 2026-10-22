/**
 * Global to Local — Complete Data Catalogue & Site Content
 * 230 Products, 13 Shelves, 19 FAQs, Reviews, and Site Configuration
 */

export const siteConfig = {
  name: "Global to Local",
  shortName: "GtL",
  tagline: "It's all about Goa",
  description: "Global to Local is a one of a kind supermarket with locally made and sourced Goan products.",
  founder: "Asha Arondekar",
  contact: {
    address: "Tarcar Mansion, Fontainhas, Panaji, Goa 403001",
    phoneDisplay: "+91 80103 67153",
    phoneHref: "tel:+918010367153",
    supportEmail: "customerservice@globaltolocal.in",
    hours: "Open throughout the week from 10 AM to 9 PM",
    mapsUrl: "https://maps.google.com/?q=Tarcar+Mansion+Fontainhas+Panaji+Goa",
    bankDetails: {
      accountName: "Global To Local",
      accountNumber: "102220110000268",
      ifscCode: "BKID0001022",
      bankName: "Bank of India",
      branch: "Miramar"
    }
  }
};

export const categories = [
  {
    "slug": "chutneys-and-spreads",
    "name": "Chutneys & Spreads",
    "blurb": "Small-batch chutneys and preserves, ground and jarred the way Goan kitchens have always done it.",
    "imageAlt": "Jars of Goan chutney and fruit preserve on a wooden counter",
    "imageSrc": "/images/catalog/pineapple-jam-250-grams.jpg"
  },
  {
    "slug": "farsaan",
    "name": "Farsaan",
    "blurb": "Crisp savouries and tea-time snacks, fried fresh and packed by hand.",
    "imageAlt": "Assorted Goan savoury snacks in paper packaging",
    "imageSrc": "/images/catalog/unpeeled-cashew-nuts-500-grams.jpg"
  },
  {
    "slug": "grains",
    "name": "Grains",
    "blurb": "Goan farm-grown rice, pulses and grains, sourced straight from the field.",
    "imageAlt": "Open sacks of red rice and pulses",
    "imageSrc": "/images/catalog/white-chawli-200-grams.jpg"
  },
  {
    "slug": "masala",
    "name": "Masala",
    "blurb": "Authentic Goan masalas, pastes and powders, mixed to household recipes.",
    "imageAlt": "Goan masala pastes and spice powders in small jars",
    "imageSrc": "/images/catalog/crop-xacuti-masala-100-grams.jpg"
  },
  {
    "slug": "oils-vinegars",
    "name": "Oils & Vinegars",
    "blurb": "Coconut oil, cashew vinegar and the sharp Goan staples that build a curry.",
    "imageAlt": "Bottles of coconut oil and Goan cashew vinegar",
    "imageSrc": "/images/catalog/cold-pressed-virgin-coconut-oil-200-ml.jpg"
  },
  {
    "slug": "papads-pickles",
    "name": "Papads & Pickles",
    "blurb": "Sun-dried papads and slow-cured pickles from self-help group kitchens.",
    "imageAlt": "Stacked papads and jars of Goan pickle",
    "imageSrc": "/images/catalog/wheat-sheviyo-100-grams.jpg"
  },
  {
    "slug": "seafood",
    "name": "Seafood",
    "blurb": "Dried and cured fish from the coast, prepared the traditional way.",
    "imageAlt": "Dried Goan fish and prawns in woven trays",
    "imageSrc": "/images/catalog/dried-sungta-150-grams.jpg"
  },
  {
    "slug": "spices",
    "name": "Spices",
    "blurb": "Whole and ground spices, kokum and cashew, all of Goan origin.",
    "imageAlt": "Whole spices, kokum and cashews displayed in bowls",
    "imageSrc": "/images/catalog/tirphal-50-grams.jpg"
  },
  {
    "slug": "sustainable-products",
    "name": "Sustainable Products",
    "blurb": "Everyday goods made to last, with less packaging and lighter impact.",
    "imageAlt": "Sustainable household products in natural materials",
    "imageSrc": "/images/catalog/mitti-vases-8211-medium.jpg"
  },
  {
    "slug": "sweet",
    "name": "Sweet",
    "blurb": "Bebinca, dodol and the desserts Goa is remembered for.",
    "imageAlt": "Traditional Goan Bebinca layered dessert cake",
    "imageSrc": "/images/site/sweet-shelf-bebinca.jpg"
  },
  {
    "slug": "wellness",
    "name": "Wellness",
    "blurb": "Balms, oils and remedies made from local botanicals.",
    "imageAlt": "Natural Goan wellness balms and oils",
    "imageSrc": "/images/catalog/old-goa-virgin-coconut-body-oil--lanvendar-200ml.jpg"
  },
  {
    "slug": "kunbi",
    "name": "Kunbi",
    "blurb": "The Kunbi weave — Goa’s oldest textile tradition, worn and gifted.",
    "imageAlt": "Folded Kunbi checked cotton textiles in red and white",
    "imageSrc": "/images/catalog/kunbi-shawl.jpg"
  },
  {
    "slug": "hand-crafted",
    "name": "Hand-Crafted",
    "blurb": "Art, craft and homeware made by hand across the state.",
    "imageAlt": "Handmade Goan craft objects and woven baskets",
    "imageSrc": "/images/catalog/goan-themed-blue-mug.jpg"
  }
];

export const products = [
  {
    "id": 6471,
    "slug": "goan-themed-blue-mug",
    "name": "Goan-themed Blue Mug",
    "price": 50000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Blue and white ceramic mugs depicting Goan themes",
    "description": "Blue and white ceramic mugs depicting Goan themes",
    "weight": "One piece",
    "imageAlt": "Goan-themed Blue Mug",
    "imageSrc": "/images/catalog/goan-themed-blue-mug.jpg",
    "gallery": [
      "/images/catalog/goan-themed-blue-mug.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6346,
    "slug": "wine-biscuits-200-grams",
    "name": "Wine Biscuits 200 grams",
    "price": 28000,
    "categorySlug": "sweet",
    "shortDescription": "Drop shaped biscuits that pair perfectly with wine",
    "description": "Drop shaped biscuits that pair perfectly with wine",
    "weight": "200 g",
    "imageAlt": "Wine Biscuits 200 grams",
    "imageSrc": "/images/catalog/wine-biscuits-200-grams.jpg",
    "gallery": [
      "/images/catalog/wine-biscuits-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6344,
    "slug": "coconut-macaroons-250-grams",
    "name": "Coconut Macaroons 250 grams",
    "price": 30000,
    "categorySlug": "sweet",
    "shortDescription": "Drop cookie made with shredded coconut",
    "description": "Drop cookie made with shredded coconut",
    "weight": "250 g",
    "imageAlt": "Coconut Macaroons 250 grams",
    "imageSrc": "/images/catalog/coconut-macaroons-250-grams.jpg",
    "gallery": [
      "/images/catalog/coconut-macaroons-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6342,
    "slug": "batika",
    "name": "Batika",
    "price": 6000,
    "categorySlug": "sweet",
    "shortDescription": "Made with semolina, coconut and sugar",
    "description": "Made with semolina, coconut and sugar",
    "weight": "One piece",
    "imageAlt": "Batika",
    "imageSrc": "/images/catalog/batika.jpg",
    "gallery": [
      "/images/catalog/batika.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6336,
    "slug": "unpeeled-cashew-nuts-500-grams",
    "name": "Unpeeled Cashew Nuts 500 grams",
    "price": 60000,
    "categorySlug": "farsaan",
    "shortDescription": "Locally grown cashews roasted with the skin, with natural taste",
    "description": "Locally grown cashews roasted with the skin, with natural taste",
    "weight": "500 g",
    "imageAlt": "Unpeeled Cashew Nuts 500 grams",
    "imageSrc": "/images/catalog/unpeeled-cashew-nuts-500-grams.jpg",
    "gallery": [
      "/images/catalog/unpeeled-cashew-nuts-500-grams.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6334,
    "slug": "garlic-sticks",
    "name": "Garlic Sticks",
    "price": 10000,
    "categorySlug": "farsaan",
    "shortDescription": "Perfect to have with dips",
    "description": "Perfect to have with dips",
    "weight": "One piece",
    "imageAlt": "Garlic Sticks",
    "imageSrc": "/images/catalog/garlic-sticks.jpg",
    "gallery": [
      "/images/catalog/garlic-sticks.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6332,
    "slug": "cones",
    "name": "Cones",
    "price": 15000,
    "categorySlug": "farsaan",
    "shortDescription": "A type of hors d’oeuvre, a cone shaped decorative food, topped with sweet or savoury food",
    "description": "A type of hors d’oeuvre, a cone shaped decorative food, topped with sweet or savoury food",
    "weight": "One piece",
    "imageAlt": "Cones",
    "imageSrc": "/images/catalog/cones.jpg",
    "gallery": [
      "/images/catalog/cones.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6330,
    "slug": "canapes",
    "name": "Canapes",
    "price": 15000,
    "categorySlug": "farsaan",
    "shortDescription": "A type of hors d’oeuvre, a small, prepared, and often decorative food, consisting of a small piece of bread wrapped or topped with savoury food",
    "description": "A type of hors d’oeuvre, a small, prepared, and often decorative food, consisting of a small piece of bread wrapped or topped with savoury food",
    "weight": "One piece",
    "imageAlt": "Canapes",
    "imageSrc": "/images/catalog/canapes.jpg",
    "gallery": [
      "/images/catalog/canapes.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6324,
    "slug": "kunbi-shawl",
    "name": "Kunbi Shawl",
    "price": 180000,
    "categorySlug": "kunbi",
    "shortDescription": "A tribal shawl handwoven by local Goan artisans in rural areas promoting Goan culture. Can be adorned by one and all.",
    "description": "Kunbi Shawl",
    "weight": "One piece",
    "imageAlt": "Kunbi Shawl",
    "imageSrc": "/images/catalog/kunbi-shawl.jpg",
    "gallery": [
      "/images/catalog/kunbi-shawl.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6323,
    "slug": "kunbi-saree-7",
    "name": "Kunbi Saree 7",
    "price": 380000,
    "categorySlug": "kunbi",
    "shortDescription": "A tribal saree handwoven by local Goan artisans in rural areas promoting Goan culture",
    "description": "Kunbi Saree 7",
    "weight": "One piece",
    "imageAlt": "Kunbi Saree 7",
    "imageSrc": "/images/catalog/kunbi-saree-7.jpg",
    "gallery": [
      "/images/catalog/kunbi-saree-7.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6322,
    "slug": "kunbi-saree-6",
    "name": "Kunbi Saree 6",
    "price": 380000,
    "categorySlug": "kunbi",
    "shortDescription": "A tribal saree handwoven by local Goan artisans in rural areas promoting Goan culture",
    "description": "Kunbi Saree 6",
    "weight": "One piece",
    "imageAlt": "Kunbi Saree 6",
    "imageSrc": "/images/catalog/kunbi-saree-6.jpg",
    "gallery": [
      "/images/catalog/kunbi-saree-6.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6321,
    "slug": "kunbi-saree-5",
    "name": "Kunbi Saree 5",
    "price": 380000,
    "categorySlug": "kunbi",
    "shortDescription": "A tribal saree handwoven by local Goan artisans in rural areas promoting Goan culture",
    "description": "Kunbi Saree 5",
    "weight": "One piece",
    "imageAlt": "Kunbi Saree 5",
    "imageSrc": "/images/catalog/kunbi-saree-5.jpg",
    "gallery": [
      "/images/catalog/kunbi-saree-5.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6320,
    "slug": "kunbi-saree-4",
    "name": "Kunbi Saree 4",
    "price": 380000,
    "categorySlug": "kunbi",
    "shortDescription": "A tribal saree handwoven by local Goan artisans in rural areas promoting Goan culture",
    "description": "Kunbi Saree 4",
    "weight": "One piece",
    "imageAlt": "Kunbi Saree 4",
    "imageSrc": "/images/catalog/kunbi-saree-4.jpg",
    "gallery": [
      "/images/catalog/kunbi-saree-4.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6314,
    "slug": "kunbi-saree-3",
    "name": "Kunbi Saree 3",
    "price": 380000,
    "categorySlug": "kunbi",
    "shortDescription": "A tribal saree handwoven by local Goan artisans in rural areas promoting Goan culture",
    "description": "Kunbi Saree 3",
    "weight": "One piece",
    "imageAlt": "Kunbi Saree 3",
    "imageSrc": "/images/catalog/kunbi-saree-3.jpg",
    "gallery": [
      "/images/catalog/kunbi-saree-3.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6312,
    "slug": "kunbi-saree-2",
    "name": "Kunbi Saree 2",
    "price": 380000,
    "categorySlug": "kunbi",
    "shortDescription": "A tribal saree handwoven by local Goan artisans in rural areas promoting Goan culture",
    "description": "Kunbi Saree 2",
    "weight": "One piece",
    "imageAlt": "Kunbi Saree 2",
    "imageSrc": "/images/catalog/kunbi-saree-2.jpg",
    "gallery": [
      "/images/catalog/kunbi-saree-2.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6310,
    "slug": "kunbi-saree-1",
    "name": "Kunbi Saree 1",
    "price": 380000,
    "categorySlug": "kunbi",
    "shortDescription": "A tribal saree handwoven by local Goan artisans in rural areas promoting Goan culture",
    "description": "Kunbi Saree 1",
    "weight": "One piece",
    "imageAlt": "Kunbi Saree 1",
    "imageSrc": "/images/catalog/kunbi-saree-1.jpg",
    "gallery": [
      "/images/catalog/kunbi-saree-1.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6268,
    "slug": "mitti-vases-8211-medium",
    "name": "Mitti Vases – Medium",
    "price": 30000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen decorative vase",
    "description": "Earthen decorative vase",
    "weight": "One piece",
    "imageAlt": "Mitti Vases – Medium",
    "imageSrc": "/images/catalog/mitti-vases-8211-medium.jpg",
    "gallery": [
      "/images/catalog/mitti-vases-8211-medium.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6267,
    "slug": "mitti-vases-8211-small",
    "name": "Mitti Vases – Small",
    "price": 20000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen decorative vase",
    "description": "Earthen decorative vase",
    "weight": "One piece",
    "imageAlt": "Mitti Vases – Small",
    "imageSrc": "/images/catalog/mitti-vases-8211-small.jpg",
    "gallery": [
      "/images/catalog/mitti-vases-8211-small.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6266,
    "slug": "mitti-suraahi",
    "name": "Mitti Suraahi",
    "price": 35000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen pot, used to keep water cool during the summer",
    "description": "Earthen pot, used to keep water cool during the summer",
    "weight": "One piece",
    "imageAlt": "Mitti Suraahi",
    "imageSrc": "/images/catalog/mitti-suraahi.jpg",
    "gallery": [
      "/images/catalog/mitti-suraahi.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6265,
    "slug": "mitti-plate",
    "name": "Mitti Plate",
    "price": 20000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen plate",
    "description": "Earthen plate",
    "weight": "One piece",
    "imageAlt": "Mitti Plate",
    "imageSrc": "/images/catalog/mitti-plate.jpg",
    "gallery": [
      "/images/catalog/mitti-plate.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6264,
    "slug": "mitti-mug",
    "name": "Mitti Mug",
    "price": 30000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen Mug",
    "description": "Earthen Mug",
    "weight": "One piece",
    "imageAlt": "Mitti Mug",
    "imageSrc": "/images/catalog/mitti-mug.jpg",
    "gallery": [
      "/images/catalog/mitti-mug.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6263,
    "slug": "mitti-kullad",
    "name": "Mitti Kullad",
    "price": 8000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen teacup, made with mud for your chai",
    "description": "Earthen teacup, made with mud for your chai",
    "weight": "One piece",
    "imageAlt": "Mitti Kullad",
    "imageSrc": "/images/catalog/mitti-kullad.jpg",
    "gallery": [
      "/images/catalog/mitti-kullad.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6262,
    "slug": "mitti-candle-holder",
    "name": "Mitti Candle Holder",
    "price": 8000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen glass",
    "description": "Earthen glass",
    "weight": "One piece",
    "imageAlt": "Mitti Candle Holder",
    "imageSrc": "/images/catalog/mitti-candle-holder.jpg",
    "gallery": [
      "/images/catalog/mitti-candle-holder.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6260,
    "slug": "mitti-foot-scrubber",
    "name": "Mitti Foot Scrubber",
    "price": 10000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen foot scrubber used for exfoliation and removal of dead skin",
    "description": "Earthen foot scrubber used for exfoliation and removal of dead skin",
    "weight": "One piece",
    "imageAlt": "Mitti Foot Scrubber",
    "imageSrc": "/images/catalog/mitti-foot-scrubber.jpg",
    "gallery": [
      "/images/catalog/mitti-foot-scrubber.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6259,
    "slug": "mitti-fish-ashtray",
    "name": "Mitti Fish Ashtray",
    "price": 35000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen ashtray in the shape of a fish",
    "description": "Earthen ashtray in the shape of a fish",
    "weight": "One piece",
    "imageAlt": "Mitti Fish Ashtray",
    "imageSrc": "/images/catalog/mitti-fish-ashtray.jpg",
    "gallery": [
      "/images/catalog/mitti-fish-ashtray.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6258,
    "slug": "mitti-dhoop-holder",
    "name": "Mitti Dhoop Holder",
    "price": 20000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen holder used to light dhoop",
    "description": "Earthen holder used to light dhoop",
    "weight": "One piece",
    "imageAlt": "Mitti Dhoop Holder",
    "imageSrc": "/images/catalog/mitti-dhoop-holder.jpg",
    "gallery": [
      "/images/catalog/mitti-dhoop-holder.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6257,
    "slug": "mitti-curd-pot",
    "name": "Mitti Curd Pot",
    "price": 45000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen pot made for the storage of curd",
    "description": "Earthen pot made for the storage of curd",
    "weight": "One piece",
    "imageAlt": "Mitti Curd Pot",
    "imageSrc": "/images/catalog/mitti-curd-pot.jpg",
    "gallery": [
      "/images/catalog/mitti-curd-pot.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6256,
    "slug": "mitti-cup",
    "name": "Mitti Cup",
    "price": 8000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen cup",
    "description": "Earthen cup",
    "weight": "One piece",
    "imageAlt": "Mitti Cup",
    "imageSrc": "/images/catalog/mitti-cup.jpg",
    "gallery": [
      "/images/catalog/mitti-cup.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6255,
    "slug": "mitti-cooking-pot",
    "name": "Mitti Cooking Pot",
    "price": 65000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen pot made with mud heat-resistant for cooking",
    "description": "Earthen pot made with mud heat-resistant for cooking",
    "weight": "One piece",
    "imageAlt": "Mitti Cooking Pot",
    "imageSrc": "/images/catalog/mitti-cooking-pot.jpg",
    "gallery": [
      "/images/catalog/mitti-cooking-pot.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6253,
    "slug": "mitti-bottle-1-litre",
    "name": "Mitti Bottle 1 litre",
    "price": 80000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Earthen bottle made with mud for liquid storage",
    "description": "Earthen bottle made with mud for liquid storage",
    "weight": "1 l",
    "imageAlt": "Mitti Bottle 1 litre",
    "imageSrc": "/images/catalog/mitti-bottle-1-litre.jpg",
    "gallery": [
      "/images/catalog/mitti-bottle-1-litre.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6252,
    "slug": "goan-themed-cloth-bags",
    "name": "Goan-themed Cloth Bags",
    "price": 35000,
    "categorySlug": "sustainable-products",
    "shortDescription": "Sustainable, hand-painted cloth bags",
    "description": "Sustainable, hand-painted cloth bags",
    "weight": "One piece",
    "imageAlt": "Goan-themed Cloth Bags",
    "imageSrc": "/images/catalog/goan-themed-cloth-bags.jpg",
    "gallery": [
      "/images/catalog/goan-themed-cloth-bags.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6215,
    "slug": "dried-sungta-150-grams",
    "name": "Dried Sungta 150 grams",
    "price": 30000,
    "categorySlug": "seafood",
    "shortDescription": "Fresh Prawns sundried and stored",
    "description": "Fresh Prawns sundried and stored",
    "weight": "150 g",
    "imageAlt": "Dried Sungta 150 grams",
    "imageSrc": "/images/catalog/dried-sungta-150-grams.jpg",
    "gallery": [
      "/images/catalog/dried-sungta-150-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6214,
    "slug": "dried-khaapi-150-grams",
    "name": "Dried Khaapi 150 grams",
    "price": 18000,
    "categorySlug": "seafood",
    "shortDescription": "Fresh Silver fish sundried and stored",
    "description": "Fresh Silver fish sundried and stored",
    "weight": "150 g",
    "imageAlt": "Dried Khaapi 150 grams",
    "imageSrc": "/images/catalog/dried-khaapi-150-grams.jpg",
    "gallery": [
      "/images/catalog/dried-khaapi-150-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6213,
    "slug": "dried-gaalmo-150-grams",
    "name": "Dried Gaalmo 150 grams",
    "price": 30000,
    "categorySlug": "seafood",
    "shortDescription": "Fresh baby Shrimp sundried and stored",
    "description": "Fresh baby Shrimp sundried and stored",
    "weight": "150 g",
    "imageAlt": "Dried Gaalmo 150 grams",
    "imageSrc": "/images/catalog/dried-gaalmo-150-grams.jpg",
    "gallery": [
      "/images/catalog/dried-gaalmo-150-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6212,
    "slug": "dried-bombil-fish-100-grams",
    "name": "Dried Bombil Fish 100 grams",
    "price": 30000,
    "categorySlug": "seafood",
    "shortDescription": "Fresh Bombay duck sundried and stored",
    "description": "Fresh Bombay duck sundried and stored",
    "weight": "100 g",
    "imageAlt": "Dried Bombil Fish 100 grams",
    "imageSrc": "/images/catalog/dried-bombil-fish-100-grams.jpg",
    "gallery": [
      "/images/catalog/dried-bombil-fish-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6211,
    "slug": "dried-bangda-fish-200-grams",
    "name": "Dried Bangda Fish 200 grams",
    "price": 30000,
    "categorySlug": "seafood",
    "shortDescription": "Fresh Mackerel sundried and stored",
    "description": "Fresh Mackerel sundried and stored",
    "weight": "200 g",
    "imageAlt": "Dried Bangda Fish 200 grams",
    "imageSrc": "/images/catalog/dried-bangda-fish-200-grams.jpg",
    "gallery": [
      "/images/catalog/dried-bangda-fish-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6205,
    "slug": "pineapple-jam-250-grams",
    "name": "Pineapple Jam 250 grams",
    "price": 19000,
    "categorySlug": "chutneys-and-spreads",
    "shortDescription": "Made with the pulp of pineapple",
    "description": "Made with the pulp of pineapple",
    "weight": "250 g",
    "imageAlt": "Pineapple Jam 250 grams",
    "imageSrc": "/images/catalog/pineapple-jam-250-grams.jpg",
    "gallery": [
      "/images/catalog/pineapple-jam-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6204,
    "slug": "raw-mango-jam-250-grams",
    "name": "Raw Mango Jam 250 grams",
    "price": 19000,
    "categorySlug": "chutneys-and-spreads",
    "shortDescription": "Made with the pulp of fresh raw mango and sweetened to taste",
    "description": "Made with the pulp of fresh raw mango and sweetened to taste",
    "weight": "250 g",
    "imageAlt": "Raw Mango Jam 250 grams",
    "imageSrc": "/images/catalog/raw-mango-jam-250-grams.jpg",
    "gallery": [
      "/images/catalog/raw-mango-jam-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6203,
    "slug": "coconut-garlic-chutney-100-grams",
    "name": "Coconut Garlic Chutney 100 grams",
    "price": 11000,
    "categorySlug": "chutneys-and-spreads",
    "shortDescription": "Desiccated coconut ground with garlic and red chillies",
    "description": "Desiccated coconut ground with garlic and red chillies",
    "weight": "100 g",
    "imageAlt": "Coconut Garlic Chutney 100 grams",
    "imageSrc": "/images/catalog/coconut-garlic-chutney-100-grams.jpg",
    "gallery": [
      "/images/catalog/coconut-garlic-chutney-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6202,
    "slug": "coconut-cashew-chutney-100-grams",
    "name": "Coconut Cashew Chutney 100 grams",
    "price": 12000,
    "categorySlug": "chutneys-and-spreads",
    "shortDescription": "Desiccated coconut ground with cashew and red chillies",
    "description": "Desiccated coconut ground with cashew and red chillies",
    "weight": "100 g",
    "imageAlt": "Coconut Cashew Chutney 100 grams",
    "imageSrc": "/images/catalog/coconut-cashew-chutney-100-grams.jpg",
    "gallery": [
      "/images/catalog/coconut-cashew-chutney-100-grams.jpg"
    ],
    "inStock": true,
    "bestSeller": true
  },
  {
    "id": 6197,
    "slug": "white-chawli-200-grams",
    "name": "White Chawli 200 grams",
    "price": 8500,
    "categorySlug": "grains",
    "shortDescription": "White Cowpea, rich in protein",
    "description": "White Cowpea, rich in protein",
    "weight": "200 g",
    "imageAlt": "White Chawli 200 grams",
    "imageSrc": "/images/catalog/white-chawli-200-grams.jpg",
    "gallery": [
      "/images/catalog/white-chawli-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6196,
    "slug": "ukda-taandul-1-kg",
    "name": "Ukda Taandul 1 kg",
    "price": 24000,
    "categorySlug": "grains",
    "shortDescription": "Par-boiled rice",
    "description": "Par-boiled rice",
    "weight": "1 kg",
    "imageAlt": "Ukda Taandul 1 kg",
    "imageSrc": "/images/catalog/ukda-taandul-1-kg.jpg",
    "gallery": [
      "/images/catalog/ukda-taandul-1-kg.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6195,
    "slug": "raagi-millet-500-grams",
    "name": "Raagi Millet 500 grams",
    "price": 8000,
    "categorySlug": "grains",
    "shortDescription": "Finger Millet that is high in protein with weight loss agents",
    "description": "Finger Millet that is high in protein with weight loss agents",
    "weight": "500 g",
    "imageAlt": "Raagi Millet 500 grams",
    "imageSrc": "/images/catalog/raagi-millet-500-grams.jpg",
    "gallery": [
      "/images/catalog/raagi-millet-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6194,
    "slug": "raagi-atta-500-grams",
    "name": "Raagi Atta 500 grams",
    "price": 10000,
    "categorySlug": "grains",
    "shortDescription": "Ragi Flour is made from the ragi grain. It is a finger millet powder that has high protein and mineral content.",
    "description": "Ragi Flour is made from the ragi grain. It is a finger millet powder that has high protein and mineral content.",
    "weight": "500 g",
    "imageAlt": "Raagi Atta 500 grams",
    "imageSrc": "/images/catalog/raagi-atta-500-grams.jpg",
    "gallery": [
      "/images/catalog/raagi-atta-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6192,
    "slug": "pohe-250-grams",
    "name": "Pohe 250 grams",
    "price": 6000,
    "categorySlug": "grains",
    "shortDescription": "Flattened brown rice used to make snacks",
    "description": "Flattened brown rice used to make snacks",
    "weight": "250 g",
    "imageAlt": "Pohe 250 grams",
    "imageSrc": "/images/catalog/pohe-250-grams.jpg",
    "gallery": [
      "/images/catalog/pohe-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6191,
    "slug": "kulith-200-grams",
    "name": "Kulith 200 grams",
    "price": 7000,
    "categorySlug": "grains",
    "shortDescription": "Horse gram, rich in protein",
    "description": "Horse gram, rich in protein",
    "weight": "200 g",
    "imageAlt": "Kulith 200 grams",
    "imageSrc": "/images/catalog/kulith-200-grams.jpg",
    "gallery": [
      "/images/catalog/kulith-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6190,
    "slug": "brown-taandul-1-kg",
    "name": "Brown Taandul 1 Kg",
    "price": 24000,
    "categorySlug": "grains",
    "shortDescription": "Locally grown brown rice",
    "description": "Locally grown brown rice",
    "weight": "1 Kg",
    "imageAlt": "Brown Taandul 1 Kg",
    "imageSrc": "/images/catalog/brown-taandul-1-kg.jpg",
    "gallery": [
      "/images/catalog/brown-taandul-1-kg.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6189,
    "slug": "alsaande-200-grams",
    "name": "Alsaande 200 grams",
    "price": 24000,
    "categorySlug": "grains",
    "shortDescription": "Black-eyed beans, rich in protein",
    "description": "Black-eyed beans, rich in protein",
    "weight": "200 g",
    "imageAlt": "Alsaande 200 grams",
    "imageSrc": "/images/catalog/alsaande-200-grams.jpg",
    "gallery": [
      "/images/catalog/alsaande-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6180,
    "slug": "coconut-shell-spoon-8211-large",
    "name": "Coconut Shell Spoon – Large",
    "price": 18000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Cooking spoon made with a coconut shell",
    "description": "Cooking spoon made with a coconut shell",
    "weight": "One piece",
    "imageAlt": "Coconut Shell Spoon – Large",
    "imageSrc": "/images/catalog/coconut-shell-spoon-8211-large.jpg",
    "gallery": [
      "/images/catalog/coconut-shell-spoon-8211-large.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6179,
    "slug": "wooden-lotus-candle-holder",
    "name": "Wooden Lotus Candle Holder",
    "price": 24000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Candle holders cut out of wood and designed",
    "description": "Candle holders cut out of wood and designed",
    "weight": "One piece",
    "imageAlt": "Wooden Lotus Candle Holder",
    "imageSrc": "/images/catalog/wooden-lotus-candle-holder.jpg",
    "gallery": [
      "/images/catalog/wooden-lotus-candle-holder.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6178,
    "slug": "wooden-flower-candle-holder",
    "name": "Wooden Flower Candle Holder",
    "price": 14500,
    "categorySlug": "hand-crafted",
    "shortDescription": "Candle holders cut out of wood and designed",
    "description": "Candle holders cut out of wood and designed",
    "weight": "One piece",
    "imageAlt": "Wooden Flower Candle Holder",
    "imageSrc": "/images/catalog/wooden-flower-candle-holder.jpg",
    "gallery": [
      "/images/catalog/wooden-flower-candle-holder.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6177,
    "slug": "whelks-shells",
    "name": "Whelks Shells",
    "price": 7000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Shells that signify Dramatic Positive Change",
    "description": "Shells that signify Dramatic Positive Change",
    "weight": "One piece",
    "imageAlt": "Whelks Shells",
    "imageSrc": "/images/catalog/whelks-shells.jpg",
    "gallery": [
      "/images/catalog/whelks-shells.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6176,
    "slug": "shell-tortoise--large",
    "name": "Shell Tortoise- Large",
    "price": 30000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Tortoise- Large",
    "imageSrc": "/images/catalog/shell-tortoise--large.jpg",
    "gallery": [
      "/images/catalog/shell-tortoise--large.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6175,
    "slug": "shell-tortoise--medium",
    "name": "Shell Tortoise- Medium",
    "price": 24000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Tortoise- Medium",
    "imageSrc": "/images/catalog/shell-tortoise--medium.jpg",
    "gallery": [
      "/images/catalog/shell-tortoise--medium.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6174,
    "slug": "shell-tortoise--small",
    "name": "Shell Tortoise- Small",
    "price": 18000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Tortoise- Small",
    "imageSrc": "/images/catalog/shell-tortoise--small.jpg",
    "gallery": [
      "/images/catalog/shell-tortoise--small.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6173,
    "slug": "shell-toothpicks",
    "name": "Shell Toothpicks",
    "price": 8000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Toothpicks",
    "imageSrc": "/images/catalog/shell-toothpicks.jpg",
    "gallery": [
      "/images/catalog/shell-toothpicks.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6172,
    "slug": "shell-skewers",
    "name": "Shell Skewers",
    "price": 18000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Skewers",
    "imageSrc": "/images/catalog/shell-skewers.jpg",
    "gallery": [
      "/images/catalog/shell-skewers.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6171,
    "slug": "shell-rooster",
    "name": "Shell Rooster",
    "price": 36000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Rooster",
    "imageSrc": "/images/catalog/shell-rooster.jpg",
    "gallery": [
      "/images/catalog/shell-rooster.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6169,
    "slug": "shell-rabbit",
    "name": "Shell Rabbit",
    "price": 30000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Rabbit",
    "imageSrc": "/images/catalog/shell-rabbit.jpg",
    "gallery": [
      "/images/catalog/shell-rabbit.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6168,
    "slug": "shell-peacock",
    "name": "Shell Peacock",
    "price": 36000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Peacock",
    "imageSrc": "/images/catalog/shell-peacock.jpg",
    "gallery": [
      "/images/catalog/shell-peacock.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6167,
    "slug": "shell-mirror--round",
    "name": "Shell Mirror- Round",
    "price": 120000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Mirror- Round",
    "imageSrc": "/images/catalog/shell-mirror--round.jpg",
    "gallery": [
      "/images/catalog/shell-mirror--round.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6165,
    "slug": "shell-mirror--square",
    "name": "Shell Mirror- Square",
    "price": 120000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Mirror- Square",
    "imageSrc": "/images/catalog/shell-mirror--square.jpg",
    "gallery": [
      "/images/catalog/shell-mirror--square.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6163,
    "slug": "shell-lamp--round",
    "name": "Shell Lamp- Round",
    "price": 120000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Lamp- Round",
    "imageSrc": "/images/catalog/shell-lamp--round.jpg",
    "gallery": [
      "/images/catalog/shell-lamp--round.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6162,
    "slug": "shell-lamp--square",
    "name": "Shell Lamp- Square",
    "price": 120000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Lamp- Square",
    "imageSrc": "/images/catalog/shell-lamp--square.jpg",
    "gallery": [
      "/images/catalog/shell-lamp--square.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6161,
    "slug": "shell-keychain",
    "name": "Shell Keychain",
    "price": 18000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Keychain",
    "imageSrc": "/images/catalog/shell-keychain.jpg",
    "gallery": [
      "/images/catalog/shell-keychain.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6159,
    "slug": "shell-ganpati",
    "name": "Shell Ganpati",
    "price": 30000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Ganpati",
    "imageSrc": "/images/catalog/shell-ganpati.jpg",
    "gallery": [
      "/images/catalog/shell-ganpati.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6158,
    "slug": "shell-frog",
    "name": "Shell Frog",
    "price": 30000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Frog",
    "imageSrc": "/images/catalog/shell-frog.jpg",
    "gallery": [
      "/images/catalog/shell-frog.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6157,
    "slug": "shell-fisherwoman",
    "name": "Shell Fisherwoman",
    "price": 42000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Fisherwoman",
    "imageSrc": "/images/catalog/shell-fisherwoman.jpg",
    "gallery": [
      "/images/catalog/shell-fisherwoman.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6156,
    "slug": "shell-dog",
    "name": "Shell Dog",
    "price": 30000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Dog",
    "imageSrc": "/images/catalog/shell-dog.jpg",
    "gallery": [
      "/images/catalog/shell-dog.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6155,
    "slug": "shell-crane",
    "name": "Shell Crane",
    "price": 30000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Crane",
    "imageSrc": "/images/catalog/shell-crane.jpg",
    "gallery": [
      "/images/catalog/shell-crane.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6154,
    "slug": "shell-chopsticks",
    "name": "Shell Chopsticks",
    "price": 12000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Chopsticks",
    "imageSrc": "/images/catalog/shell-chopsticks.jpg",
    "gallery": [
      "/images/catalog/shell-chopsticks.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6153,
    "slug": "shell-birds",
    "name": "Shell Birds",
    "price": 32000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Crafted with shells found on the shore of Goa",
    "description": "Crafted with shells found on the shore of Goa",
    "weight": "One piece",
    "imageAlt": "Shell Birds",
    "imageSrc": "/images/catalog/shell-birds.jpg",
    "gallery": [
      "/images/catalog/shell-birds.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6152,
    "slug": "mud-rooster",
    "name": "Mud Rooster",
    "price": 36000,
    "categorySlug": "hand-crafted",
    "shortDescription": "",
    "description": "",
    "weight": "One piece",
    "imageAlt": "Mud Rooster",
    "imageSrc": "/images/catalog/mud-rooster.jpg",
    "gallery": [
      "/images/catalog/mud-rooster.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6151,
    "slug": "jute-pot-holder",
    "name": "Jute Pot Holder",
    "price": 6000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Made with coconut leaves to keep earthen pots",
    "description": "Made with coconut leaves to keep earthen pots",
    "weight": "One piece",
    "imageAlt": "Jute Pot Holder",
    "imageSrc": "/images/catalog/jute-pot-holder.jpg",
    "gallery": [
      "/images/catalog/jute-pot-holder.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6150,
    "slug": "goan-themed-colourful-tiles",
    "name": "Goan-themed Colourful Tiles",
    "price": 80000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Colourful ceramic tiles depicting Goan themes",
    "description": "Colourful ceramic tiles depicting Goan themes",
    "weight": "One piece",
    "imageAlt": "Goan-themed Colourful Tiles",
    "imageSrc": "/images/catalog/goan-themed-colourful-tiles.jpg",
    "gallery": [
      "/images/catalog/goan-themed-colourful-tiles.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6149,
    "slug": "goan-themed-colourful-mugs",
    "name": "Goan-themed Colourful Mugs",
    "price": 48000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Colourful ceramic mugs depicting Goan themes",
    "description": "Colourful ceramic mugs depicting Goan themes",
    "weight": "One piece",
    "imageAlt": "Goan-themed Colourful Mugs",
    "imageSrc": "/images/catalog/goan-themed-colourful-mugs.jpg",
    "gallery": [
      "/images/catalog/goan-themed-colourful-mugs.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6148,
    "slug": "goan-themed-blue-tiles",
    "name": "Goan-themed Blue Tiles",
    "price": 70000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Blue & white ceramic tiles depicting Goan themes",
    "description": "Blue & white ceramic tiles depicting Goan themes",
    "weight": "One piece",
    "imageAlt": "Goan-themed Blue Tiles",
    "imageSrc": "/images/catalog/goan-themed-blue-tiles.jpg",
    "gallery": [
      "/images/catalog/goan-themed-blue-tiles.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6147,
    "slug": "goan-recipe-book",
    "name": "Goan Recipe Book",
    "price": 26000,
    "categorySlug": "hand-crafted",
    "shortDescription": "A simple Goan recipe book to explore all that the cuisine has to offer",
    "description": "A simple Goan recipe book to explore all that the cuisine has to offer",
    "weight": "One piece",
    "imageAlt": "Goan Recipe Book",
    "imageSrc": "/images/catalog/goan-recipe-book.jpg",
    "gallery": [
      "/images/catalog/goan-recipe-book.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6146,
    "slug": "goan-painting-four",
    "name": "Goan Painting Four",
    "price": 200000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Goan themes painted by a local Goan artist",
    "description": "Goan themes painted by a local Goan artist",
    "weight": "One piece",
    "imageAlt": "Goan Painting Four",
    "imageSrc": "/images/catalog/goan-painting-four.jpg",
    "gallery": [
      "/images/catalog/goan-painting-four.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6145,
    "slug": "goan-painting-three",
    "name": "Goan Painting Three",
    "price": 200000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Goan themes painted by a local Goan artist",
    "description": "Goan themes painted by a local Goan artist",
    "weight": "One piece",
    "imageAlt": "Goan Painting Three",
    "imageSrc": "/images/catalog/goan-painting-three.jpg",
    "gallery": [
      "/images/catalog/goan-painting-three.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6144,
    "slug": "goan-painting-two",
    "name": "Goan Painting Two",
    "price": 200000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Goan themes painted by a local Goan artist",
    "description": "Goan themes painted by a local Goan artist",
    "weight": "One piece",
    "imageAlt": "Goan Painting Two",
    "imageSrc": "/images/catalog/goan-painting-two.jpg",
    "gallery": [
      "/images/catalog/goan-painting-two.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6143,
    "slug": "goan-painting-one",
    "name": "Goan Painting One",
    "price": 200000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Goan themes painted by a local Goan artist",
    "description": "Goan themes painted by a local Goan artist",
    "weight": "One piece",
    "imageAlt": "Goan Painting One",
    "imageSrc": "/images/catalog/goan-painting-one.jpg",
    "gallery": [
      "/images/catalog/goan-painting-one.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6142,
    "slug": "mud-statue-of-fisherwoman",
    "name": "Mud Statue of Fisherwoman",
    "price": 80000,
    "categorySlug": "hand-crafted",
    "shortDescription": "A statue made of mud, depicting the life of a Goan fisherwoman",
    "description": "A statue made of mud, depicting the life of a Goan fisherwoman",
    "weight": "One piece",
    "imageAlt": "Mud Statue of Fisherwoman",
    "imageSrc": "/images/catalog/mud-statue-of-fisherwoman.jpg",
    "gallery": [
      "/images/catalog/mud-statue-of-fisherwoman.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6141,
    "slug": "cowrie-shells",
    "name": "Cowrie Shells",
    "price": 7000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Shells that signify Prosperity & Money",
    "description": "Shells that signify Prosperity & Money",
    "weight": "One piece",
    "imageAlt": "Cowrie Shells",
    "imageSrc": "/images/catalog/cowrie-shells.jpg",
    "gallery": [
      "/images/catalog/cowrie-shells.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6140,
    "slug": "conche-shells",
    "name": "Conche Shells",
    "price": 7000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Shells that signify Love",
    "description": "Shells that signify Love",
    "weight": "One piece",
    "imageAlt": "Conche Shells",
    "imageSrc": "/images/catalog/conche-shells.jpg",
    "gallery": [
      "/images/catalog/conche-shells.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6139,
    "slug": "colourful-mud-rooster",
    "name": "Colourful Mud Rooster",
    "price": 72000,
    "categorySlug": "hand-crafted",
    "shortDescription": "Displayed outside Goan households as a sign of prosperity",
    "description": "Displayed outside Goan households as a sign of prosperity",
    "weight": "One piece",
    "imageAlt": "Colourful Mud Rooster",
    "imageSrc": "/images/catalog/colourful-mud-rooster.jpg",
    "gallery": [
      "/images/catalog/colourful-mud-rooster.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6138,
    "slug": "coconut-shell-spoon--small",
    "name": "Coconut Shell Spoon- Small",
    "price": 14500,
    "categorySlug": "hand-crafted",
    "shortDescription": "Cooking spoon made with a coconut shell",
    "description": "Cooking spoon made with a coconut shell",
    "weight": "One piece",
    "imageAlt": "Coconut Shell Spoon- Small",
    "imageSrc": "/images/catalog/coconut-shell-spoon--small.jpg",
    "gallery": [
      "/images/catalog/coconut-shell-spoon--small.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6135,
    "slug": "cane-soop",
    "name": "Cane Soop",
    "price": 25000,
    "categorySlug": "hand-crafted",
    "shortDescription": "A cane soop used by the locals",
    "description": "A cane soop used by the locals",
    "weight": "One piece",
    "imageAlt": "Cane Soop",
    "imageSrc": "/images/catalog/cane-soop.jpg",
    "gallery": [
      "/images/catalog/cane-soop.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6134,
    "slug": "cane-paatlo",
    "name": "Cane Paatlo",
    "price": 25000,
    "categorySlug": "hand-crafted",
    "shortDescription": "A cane basket used by the locals",
    "description": "A cane basket used by the locals",
    "weight": "One piece",
    "imageAlt": "Cane Paatlo",
    "imageSrc": "/images/catalog/cane-paatlo.jpg",
    "gallery": [
      "/images/catalog/cane-paatlo.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6088,
    "slug": "old-goa-virgin-coconut-body-oil--lanvendar-200ml",
    "name": "Old Goa Virgin Coconut Body Oil- Lanvendar 200ml",
    "price": 50000,
    "categorySlug": "wellness",
    "shortDescription": "Extracted from fresh coconut milk and 100% natural. When applied, this restores the skin’s natural oil balance",
    "description": "Extracted from fresh coconut milk and 100% natural. When applied, this restores the skin’s natural oil balance",
    "weight": "200ml",
    "imageAlt": "Old Goa Virgin Coconut Body Oil- Lanvendar 200ml",
    "imageSrc": "/images/catalog/old-goa-virgin-coconut-body-oil--lanvendar-200ml.jpg",
    "gallery": [
      "/images/catalog/old-goa-virgin-coconut-body-oil--lanvendar-200ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6086,
    "slug": "old-goa-virgin-coconut-body-oil--english-rose-200ml",
    "name": "Old Goa Virgin Coconut Body Oil- English Rose 200ml",
    "price": 50000,
    "categorySlug": "wellness",
    "shortDescription": "Extracted from fresh coconut milk and 100% natural. When applied, this restores the skin’s natural oil balance",
    "description": "Extracted from fresh coconut milk and 100% natural. When applied, this restores the skin’s natural oil balance",
    "weight": "200ml",
    "imageAlt": "Old Goa Virgin Coconut Body Oil- English Rose 200ml",
    "imageSrc": "/images/catalog/old-goa-virgin-coconut-body-oil--english-rose-200ml.jpg",
    "gallery": [
      "/images/catalog/old-goa-virgin-coconut-body-oil--english-rose-200ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6085,
    "slug": "epsom-salts-100-grams",
    "name": "Epsom Salts 100 grams",
    "price": 35000,
    "categorySlug": "wellness",
    "shortDescription": "Therapeutic in nature, these salts are used to relax muscles and relieve pain. It may also help in relieving migraines and headaches.",
    "description": "Therapeutic in nature, these salts are used to relax muscles and relieve pain. It may also help in relieving migraines and headaches.",
    "weight": "100 g",
    "imageAlt": "Epsom Salts 100 grams",
    "imageSrc": "/images/catalog/epsom-salts-100-grams.jpg",
    "gallery": [
      "/images/catalog/epsom-salts-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6084,
    "slug": "paaripat-30-grams",
    "name": "Paaripat 30 grams",
    "price": 7000,
    "categorySlug": "wellness",
    "shortDescription": "A local herb, boiled in water and used to treat cold and flus",
    "description": "A local herb, boiled in water and used to treat cold and flus",
    "weight": "30 g",
    "imageAlt": "Paaripat 30 grams",
    "imageSrc": "/images/catalog/paaripat-30-grams.jpg",
    "gallery": [
      "/images/catalog/paaripat-30-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6083,
    "slug": "kokum-butter-per-piece",
    "name": "Kokum Butter per piece",
    "price": 18000,
    "categorySlug": "wellness",
    "shortDescription": "Derived from the Kokum tree, this product can be applied to a washed and dried part of the body to treat dry skin",
    "description": "Derived from the Kokum tree, this product can be applied to a washed and dried part of the body to treat dry skin",
    "weight": "per piece",
    "imageAlt": "Kokum Butter per piece",
    "imageSrc": "/images/catalog/kokum-butter-per-piece.jpg",
    "gallery": [
      "/images/catalog/kokum-butter-per-piece.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6082,
    "slug": "kodu-50-grams",
    "name": "Kodu 50 grams",
    "price": 9000,
    "categorySlug": "wellness",
    "shortDescription": "A local herb used to maintain blood sugar levels.",
    "description": "A local herb used to maintain blood sugar levels.",
    "weight": "50 g",
    "imageAlt": "Kodu 50 grams",
    "imageSrc": "/images/catalog/kodu-50-grams.jpg",
    "gallery": [
      "/images/catalog/kodu-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6081,
    "slug": "kiraayte-50-grams",
    "name": "Kiraayte 50 grams",
    "price": 7000,
    "categorySlug": "wellness",
    "shortDescription": "A local herb, boiled and used to treat an upset stomach.",
    "description": "A local herb, boiled and used to treat an upset stomach.",
    "weight": "50 g",
    "imageAlt": "Kiraayte 50 grams",
    "imageSrc": "/images/catalog/kiraayte-50-grams.jpg",
    "gallery": [
      "/images/catalog/kiraayte-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6080,
    "slug": "handmade-soap--besan",
    "name": "Handmade Soap- Besan",
    "price": 11000,
    "categorySlug": "wellness",
    "shortDescription": "A Gram Flour based natural soap made without chemicals and synthetics, it moisturizes your hands better and longer with its glycerine content.",
    "description": "A Gram Flour based natural soap made without chemicals and synthetics, it moisturizes your hands better and longer with its glycerine content.",
    "weight": "One piece",
    "imageAlt": "Handmade Soap- Besan",
    "imageSrc": "/images/catalog/handmade-soap--besan.jpg",
    "gallery": [
      "/images/catalog/handmade-soap--besan.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6079,
    "slug": "handmade-soap--charcoal",
    "name": "Handmade Soap- Charcoal",
    "price": 11000,
    "categorySlug": "wellness",
    "shortDescription": "A Charcoal based natural soap made without chemicals and synthetics, it moisturizes your hands better and longer with its glycerine content.",
    "description": "A Charcoal based natural soap made without chemicals and synthetics, it moisturizes your hands better and longer with its glycerine content.",
    "weight": "One piece",
    "imageAlt": "Handmade Soap- Charcoal",
    "imageSrc": "/images/catalog/handmade-soap--charcoal.jpg",
    "gallery": [
      "/images/catalog/handmade-soap--charcoal.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6078,
    "slug": "handmade-soap--neem",
    "name": "Handmade Soap- Neem",
    "price": 11000,
    "categorySlug": "wellness",
    "shortDescription": "A Neem based natural soap made without chemicals and synthetics, it moisturizes your hands better and longer with its glycerine content.",
    "description": "A Neem based natural soap made without chemicals and synthetics, it moisturizes your hands better and longer with its glycerine content.",
    "weight": "One piece",
    "imageAlt": "Handmade Soap- Neem",
    "imageSrc": "/images/catalog/handmade-soap--besan.jpg",
    "gallery": [
      "/images/catalog/handmade-soap--besan.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6077,
    "slug": "dhoop",
    "name": "Dhoop",
    "price": 13000,
    "categorySlug": "wellness",
    "shortDescription": "A type of extruded incense, lacking a core bamboo stick.",
    "description": "A type of extruded incense, lacking a core bamboo stick.",
    "weight": "One piece",
    "imageAlt": "Dhoop",
    "imageSrc": "/images/catalog/dhoop.jpg",
    "gallery": [
      "/images/catalog/dhoop.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6076,
    "slug": "cow-dung-diyas-10-pieces",
    "name": "Cow dung Diyas 10 pieces",
    "price": 12000,
    "categorySlug": "wellness",
    "shortDescription": "Made with pure desi cow dung dried and moulded. They can be lit during any time of the day, it is said to release positive energy and remove toxic air.",
    "description": "Made with pure desi cow dung dried and moulded. They can be lit during any time of the day, it is said to release positive energy and remove toxic air.",
    "weight": "One piece",
    "imageAlt": "Cow dung Diyas 10 pieces",
    "imageSrc": "/images/catalog/cow-dung-diyas-10-pieces.jpg",
    "gallery": [
      "/images/catalog/cow-dung-diyas-10-pieces.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6075,
    "slug": "bath-salts--rose-500-grams",
    "name": "Bath Salts- Rose 500 grams",
    "price": 7000,
    "categorySlug": "wellness",
    "shortDescription": "The perfect way to enhance a relaxing soak in the tub; these Rose scented bath salts can be used to relieve skin inflammation and irritation",
    "description": "The perfect way to enhance a relaxing soak in the tub; these Rose scented bath salts can be used to relieve skin inflammation and irritation",
    "weight": "500 g",
    "imageAlt": "Bath Salts- Rose 500 grams",
    "imageSrc": "/images/catalog/bath-salts--rose-500-grams.jpg",
    "gallery": [
      "/images/catalog/bath-salts--rose-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6074,
    "slug": "bath-salts--lotus-500-grams",
    "name": "Bath Salts- Lotus 500 grams",
    "price": 7000,
    "categorySlug": "wellness",
    "shortDescription": "The perfect way to enhance a relaxing soak in the tub; these Lotus scented bath salts can be used to relieve skin inflammation and irritation",
    "description": "The perfect way to enhance a relaxing soak in the tub; these Lotus scented bath salts can be used to relieve skin inflammation and irritation",
    "weight": "500 g",
    "imageAlt": "Bath Salts- Lotus 500 grams",
    "imageSrc": "/images/catalog/bath-salts--lotus-500-grams.jpg",
    "gallery": [
      "/images/catalog/bath-salts--lotus-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6073,
    "slug": "bath-salts--lavender-500-grams",
    "name": "Bath Salts- Lavender 500 grams",
    "price": 7000,
    "categorySlug": "wellness",
    "shortDescription": "The perfect way to enhance a relaxing soak in the tub; these Lavender scented bath salts can be used to relieve skin inflammation and irritation",
    "description": "The perfect way to enhance a relaxing soak in the tub; these Lavender scented bath salts can be used to relieve skin inflammation and irritation",
    "weight": "500 g",
    "imageAlt": "Bath Salts- Lavender 500 grams",
    "imageSrc": "/images/catalog/bath-salts--lavender-500-grams.jpg",
    "gallery": [
      "/images/catalog/bath-salts--lavender-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6072,
    "slug": "bath-salts--coffee-500-grams",
    "name": "Bath Salts- Coffee 500 grams",
    "price": 7000,
    "categorySlug": "wellness",
    "shortDescription": "The perfect way to enhance a relaxing soak in the tub; these Coffee scented bath salts can be used to relieve skin inflammation and irritation",
    "description": "The perfect way to enhance a relaxing soak in the tub; these Coffee scented bath salts can be used to relieve skin inflammation and irritation",
    "weight": "500 g",
    "imageAlt": "Bath Salts- Coffee 500 grams",
    "imageSrc": "/images/catalog/bath-salts--coffee-500-grams.jpg",
    "gallery": [
      "/images/catalog/bath-salts--coffee-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6071,
    "slug": "bath-salts-sandalwood-500-grams",
    "name": "Bath Salts – Sandalwood 500 grams",
    "price": 7000,
    "categorySlug": "wellness",
    "shortDescription": "The perfect way to enhance a relaxing soak in the tub; these Sandalwood scented bath salts can be used to relieve skin inflammation and irritation.",
    "description": "The perfect way to enhance a relaxing soak in the tub; these Sandalwood scented bath salts can be used to relieve skin inflammation and irritation.",
    "weight": "500 g",
    "imageAlt": "Bath Salts – Sandalwood 500 grams",
    "imageSrc": "/images/catalog/bath-salts-sandalwood-500-grams.jpg",
    "gallery": [
      "/images/catalog/bath-salts-sandalwood-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6070,
    "slug": "agarbatti-8211-sandalwood-80-grams",
    "name": "Agarbatti – Sandalwood 80 grams",
    "price": 7500,
    "categorySlug": "wellness",
    "shortDescription": "Incense sticks with Sandalwood aroma",
    "description": "Incense sticks with Sandalwood aroma",
    "weight": "80 g",
    "imageAlt": "Agarbatti – Sandalwood 80 grams",
    "imageSrc": "/images/catalog/agarbatti-8211-sandalwood-80-grams.jpg",
    "gallery": [
      "/images/catalog/agarbatti-8211-sandalwood-80-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6069,
    "slug": "agarbatti-lavender-80-grams",
    "name": "Agarbatti – Lavender 80 grams",
    "price": 7500,
    "categorySlug": "wellness",
    "shortDescription": "Incense sticks with Lavender aroma",
    "description": "Incense sticks with Lavender aroma",
    "weight": "80 g",
    "imageAlt": "Agarbatti – Lavender 80 grams",
    "imageSrc": "/images/catalog/agarbatti-8211-sandalwood-80-grams.jpg",
    "gallery": [
      "/images/catalog/agarbatti-8211-sandalwood-80-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6068,
    "slug": "agarbatti--musk-80-grams",
    "name": "Agarbatti- Musk 80 grams",
    "price": 7500,
    "categorySlug": "wellness",
    "shortDescription": "Incense sticks with Musk aroma",
    "description": "Incense sticks with Musk aroma",
    "weight": "80 g",
    "imageAlt": "Agarbatti- Musk 80 grams",
    "imageSrc": "/images/catalog/agarbatti-8211-sandalwood-80-grams.jpg",
    "gallery": [
      "/images/catalog/agarbatti-8211-sandalwood-80-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6051,
    "slug": "crop-xacuti-masala-100-grams",
    "name": "Crop Xacuti Masala 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "Xacuti or Shagoti hails from the Pernem district of Goa. Historically, local fishermen would prepare a sauce or gravy containing spices. Added to this would be lightly toasted coco",
    "description": "Xacuti or Shagoti hails from the Pernem district of Goa. Historically, local fishermen would prepare a sauce or gravy containing spices. Added to this would be lightly toasted coconut and white poppy seeds. This sauce would then be served with freshly caught fish or chicken.",
    "weight": "100 g",
    "imageAlt": "Crop Xacuti Masala 100 grams",
    "imageSrc": "/images/catalog/crop-xacuti-masala-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-xacuti-masala-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6050,
    "slug": "crop-sorpotel-masala-powder-100-grams",
    "name": "Crop Sorpotel Masala Powder 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "The flavours are just incredible, spicy hot but with lots of depth from the pork meat and some special ingredients, the powder can be used during the marination process to get auth",
    "description": "The flavours are just incredible, spicy hot but with lots of depth from the pork meat and some special ingredients, the powder can be used during the marination process to get authentic flavour.",
    "weight": "100 g",
    "imageAlt": "Crop Sorpotel Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-sorpotel-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-sorpotel-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6049,
    "slug": "crop-samarachi-kodi-masala-powder-100-grams",
    "name": "Crop Samarachi Kodi Masala Powder 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "This curry can be made with dry prawns and you can try experimenting with dry Bombay duck",
    "description": "This curry can be made with dry prawns and you can try experimenting with dry Bombay duck",
    "weight": "100 g",
    "imageAlt": "Crop Samarachi Kodi Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-samarachi-kodi-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-samarachi-kodi-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6048,
    "slug": "crop-peri-peri-mix-100-grams",
    "name": "Crop Peri Peri Mix 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "A Portuguese flavour, Peri-peri is a cultivar of Capsicum frutescens from the malagueta pepper.",
    "description": "A Portuguese flavour, Peri-peri is a cultivar of Capsicum frutescens from the malagueta pepper.",
    "weight": "100 g",
    "imageAlt": "Crop Peri Peri Mix 100 grams",
    "imageSrc": "/images/catalog/crop-peri-peri-mix-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-peri-peri-mix-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6047,
    "slug": "crop-mutton-masala-powder-100-grams",
    "name": "Crop Mutton Masala Powder 100 grams",
    "price": 7000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go into the marination of Goan mutton are grinded together",
    "description": "Spices that go into the marination of Goan mutton are grinded together",
    "weight": "100 g",
    "imageAlt": "Crop Mutton Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-mutton-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-mutton-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6046,
    "slug": "crop-goan-curry-powder-100-grams",
    "name": "Crop Goan Curry Powder 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go into Goan curries are grinded together",
    "description": "Spices that go into Goan curries are grinded together",
    "weight": "100 g",
    "imageAlt": "Crop Goan Curry Powder 100 grams",
    "imageSrc": "/images/catalog/crop-goan-curry-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-goan-curry-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6045,
    "slug": "crop-fish-fry-masala-powder-100-grams",
    "name": "Crop Fish Fry Masala Powder 100 grams",
    "price": 7000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go into the marination of Goan fish fry are grinded together",
    "description": "Spices that go into the marination of Goan fish fry are grinded together",
    "weight": "100 g",
    "imageAlt": "Crop Fish Fry Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-fish-fry-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-fish-fry-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6044,
    "slug": "crop-fish-curry-masala-powder-100-grams",
    "name": "Crop Fish Curry Masala Powder 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go in the Goan fish curry are grinded together",
    "description": "Spices that go in the Goan fish curry are grinded together",
    "weight": "100 g",
    "imageAlt": "Crop Fish Curry Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-fish-curry-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-fish-curry-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6043,
    "slug": "crop-crab-xec-xec-masala-powder-100-grams",
    "name": "Crop Crab Xec Xec Masala Powder 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "A very fragrant and scrumptious Goan curry typically made with crabs. The roasting of all the ingredients for the masala is what elevates the flavour of this curry and takes it to ",
    "description": "A very fragrant and scrumptious Goan curry typically made with crabs. The roasting of all the ingredients for the masala is what elevates the flavour of this curry and takes it to a whole new level.",
    "weight": "100 g",
    "imageAlt": "Crop Crab Xec Xec Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-crab-xec-xec-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-crab-xec-xec-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6042,
    "slug": "crop-chicken-masala-powder-100-grams",
    "name": "Crop Chicken Masala Powder 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go in the Goan chicken curry are grinded together",
    "description": "Spices that go in the Goan chicken curry are grinded together",
    "weight": "100 g",
    "imageAlt": "Crop Chicken Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-chicken-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-chicken-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6041,
    "slug": "crop-caldine-masala-powder-100-grams",
    "name": "Crop Caldine Masala Powder 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "Goan Caldine or Caldinho is a mild and delicious, yellow seafood curry made with few spices and coconut milk extract.",
    "description": "Goan Caldine or Caldinho is a mild and delicious, yellow seafood curry made with few spices and coconut milk extract.",
    "weight": "100 g",
    "imageAlt": "Crop Caldine Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-caldine-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-caldine-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6040,
    "slug": "crop-cafreal-masala-mix-100-grams",
    "name": "Crop Cafreal Masala Mix 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "Cafreal is typically made from whole chicken legs, flavoured with the spices and herbs mentioned and then shallow fried. A spicy chicken preparation that originated from the Portug",
    "description": "Cafreal is typically made from whole chicken legs, flavoured with the spices and herbs mentioned and then shallow fried. A spicy chicken preparation that originated from the Portuguese colonies in the African continent.",
    "weight": "100 g",
    "imageAlt": "Crop Cafreal Masala Mix 100 grams",
    "imageSrc": "/images/catalog/crop-cafreal-masala-mix-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-cafreal-masala-mix-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6039,
    "slug": "crop-balchao-masala-powder-100-grams",
    "name": "Crop Balchao Masala Powder 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "Balchao refers to the method of cooking where seafood is pickled in a spicy and tangy tomato-vinegar based sauce.",
    "description": "Balchao refers to the method of cooking where seafood is pickled in a spicy and tangy tomato-vinegar based sauce.",
    "weight": "100 g",
    "imageAlt": "Crop Balchao Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-balchao-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-balchao-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6038,
    "slug": "crop-ambot-tik-masala-powder-100-grams",
    "name": "Crop Ambot Tik Masala Powder 100 grams",
    "price": 9000,
    "categorySlug": "masala",
    "shortDescription": "Ambot tik is actually two words, ambot which means tangy/sour & tik which means hot/spicy in Konkani. Shark ambot tik curry is a hot and tangy, classic Goan fish curry. Pair it",
    "description": "Ambot tik is actually two words, ambot which means tangy/sour & tik which means hot/spicy in Konkani. Shark ambot tik curry is a hot and tangy, classic Goan fish curry. Pair it with some rice and some sautéed veggie for a hearty Goan fare!",
    "weight": "100 g",
    "imageAlt": "Crop Ambot Tik Masala Powder 100 grams",
    "imageSrc": "/images/catalog/crop-ambot-tik-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/crop-ambot-tik-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6036,
    "slug": "udda-methi-powder-250-grams",
    "name": "Udda Methi Powder 250 grams",
    "price": 36000,
    "categorySlug": "masala",
    "shortDescription": "The unique combination of flavours rendered by roasted methi seeds, grated coconut, and tamarind will leave you asking for more!",
    "description": "The unique combination of flavours rendered by roasted methi seeds, grated coconut, and tamarind will leave you asking for more!",
    "weight": "250 g",
    "imageAlt": "Udda Methi Powder 250 grams",
    "imageSrc": "/images/catalog/udda-methi-powder-250-grams.jpg",
    "gallery": [
      "/images/catalog/udda-methi-powder-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6035,
    "slug": "sorpotel-masala-paste-250-grams",
    "name": "Sorpotel Masala Paste 250 grams",
    "price": 32500,
    "categorySlug": "masala",
    "shortDescription": "The flavours are just incredible, spicy hot but with lots of depth from the pork meat and some special ingredients that give the paste a nice touch.",
    "description": "The flavours are just incredible, spicy hot but with lots of depth from the pork meat and some special ingredients that give the paste a nice touch.",
    "weight": "250 g",
    "imageAlt": "Sorpotel Masala Paste 250 grams",
    "imageSrc": "/images/catalog/sorpotel-masala-paste-250-grams.jpg",
    "gallery": [
      "/images/catalog/sorpotel-masala-paste-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6034,
    "slug": "samarachi-koddi-powder-250-grams",
    "name": "Samarachi Koddi Powder 250 grams",
    "price": 36000,
    "categorySlug": "masala",
    "shortDescription": "This curry can be made with dry prawns and you can try experimenting with dry Bombay duck",
    "description": "This curry can be made with dry prawns and you can try experimenting with dry Bombay duck",
    "weight": "250 g",
    "imageAlt": "Samarachi Koddi Powder 250 grams",
    "imageSrc": "/images/catalog/samarachi-koddi-powder-250-grams.jpg",
    "gallery": [
      "/images/catalog/samarachi-koddi-powder-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6033,
    "slug": "rechado-masala-paste-500-grams",
    "name": "Rechado Masala Paste 500 grams",
    "price": 65000,
    "categorySlug": "masala",
    "shortDescription": "A staple spice paste which is found in every Goan home. It is normally used for seafood especially for fishes like Mackerel and pomfret, where they are simply stuffed with this spi",
    "description": "A staple spice paste which is found in every Goan home. It is normally used for seafood especially for fishes like Mackerel and pomfret, where they are simply stuffed with this spice paste and then shallow fried. However this spice paste is very versatile and can be used for chicken and vegetables as well.",
    "weight": "500 g",
    "imageAlt": "Rechado Masala Paste 500 grams",
    "imageSrc": "/images/catalog/rechado-masala-paste-500-grams.jpg",
    "gallery": [
      "/images/catalog/rechado-masala-paste-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6032,
    "slug": "prawn-curry-masala-powder-250-grams",
    "name": "Prawn Curry Masala Powder 250 grams",
    "price": 36000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go into the marination of Goan prawn curry are grinded together",
    "description": "Spices that go into the marination of Goan prawn curry are grinded together",
    "weight": "250 g",
    "imageAlt": "Prawn Curry Masala Powder 250 grams",
    "imageSrc": "/images/catalog/prawn-curry-masala-powder-250-grams.jpg",
    "gallery": [
      "/images/catalog/prawn-curry-masala-powder-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6031,
    "slug": "pork-vindaloo-masala-powder-250-grams",
    "name": "Pork Vindaloo Masala Powder 250 grams",
    "price": 48000,
    "categorySlug": "masala",
    "shortDescription": "Portuguese sailor’s “preserved” raw ingredients, packed in wooden barrels of alternate layers of pork and garlic, and soaked in red wine. This was adapted and fur",
    "description": "Portuguese sailor’s “preserved” raw ingredients, packed in wooden barrels of alternate layers of pork and garlic, and soaked in red wine. This was adapted and further evolved by local Goan cooks with the substitution of palm vinegar for the red wine, and the addition of spices.",
    "weight": "250 g",
    "imageAlt": "Pork Vindaloo Masala Powder 250 grams",
    "imageSrc": "/images/catalog/pork-vindaloo-masala-powder-250-grams.jpg",
    "gallery": [
      "/images/catalog/pork-vindaloo-masala-powder-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6030,
    "slug": "pork-roast-masala-powder-250-grams",
    "name": "Pork Roast Masala Powder 250 grams",
    "price": 51000,
    "categorySlug": "masala",
    "shortDescription": "Goan pork roast spices and grinded together.",
    "description": "Goan pork roast spices and grinded together.",
    "weight": "250 g",
    "imageAlt": "Pork Roast Masala Powder 250 grams",
    "imageSrc": "/images/catalog/pork-roast-masala-powder-250-grams.jpg",
    "gallery": [
      "/images/catalog/pork-roast-masala-powder-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6029,
    "slug": "pork-curry-masala-powder-250-grams",
    "name": "Pork Curry Masala Powder 250 grams",
    "price": 51000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go in the Goan Pork curry are grinded together.",
    "description": "Spices that go in the Goan Pork curry are grinded together.",
    "weight": "250 g",
    "imageAlt": "Pork Curry Masala Powder 250 grams",
    "imageSrc": "/images/catalog/pork-curry-masala-powder-250-grams.jpg",
    "gallery": [
      "/images/catalog/pork-curry-masala-powder-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6028,
    "slug": "fish-fry-masala-powder-250-grams",
    "name": "Fish Fry Masala Powder 250 grams",
    "price": 36000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go into the marination of Goan fish fry are grinded together.",
    "description": "Spices that go into the marination of Goan fish fry are grinded together.",
    "weight": "250 g",
    "imageAlt": "Fish Fry Masala Powder 250 grams",
    "imageSrc": "/images/catalog/fish-fry-masala-powder-250-grams.jpg",
    "gallery": [
      "/images/catalog/fish-fry-masala-powder-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6027,
    "slug": "fish-curry-powder-250-grams",
    "name": "Fish Curry Powder 250 grams",
    "price": 36000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go in the Goan fish curry are grinded together.",
    "description": "Spices that go in the Goan fish curry are grinded together.",
    "weight": "250 g",
    "imageAlt": "Fish Curry Powder 250 grams",
    "imageSrc": "/images/catalog/fish-curry-powder-250-grams.jpg",
    "gallery": [
      "/images/catalog/fish-curry-powder-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6026,
    "slug": "fish-curry-masala-powder-200-grams",
    "name": "Fish Curry Masala Powder 200 grams",
    "price": 36000,
    "categorySlug": "masala",
    "shortDescription": "Spices that go in the Goan fish curry are grinded together.",
    "description": "Spices that go in the Goan fish curry are grinded together.",
    "weight": "200 g",
    "imageAlt": "Fish Curry Masala Powder 200 grams",
    "imageSrc": "/images/catalog/fish-curry-masala-powder-200-grams.jpg",
    "gallery": [
      "/images/catalog/fish-curry-masala-powder-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6025,
    "slug": "chicken-xacuti-masala-powder-200-grams",
    "name": "Chicken Xacuti Masala Powder 200 grams",
    "price": 40000,
    "categorySlug": "masala",
    "shortDescription": "Xacuti or Shagoti hails from the Pernem district of Goa. Historically, local fishermen would prepare a sauce or gravy containing spices. Added to this would be lightly toasted coco",
    "description": "Xacuti or Shagoti hails from the Pernem district of Goa. Historically, local fishermen would prepare a sauce or gravy containing spices. Added to this would be lightly toasted coconut and white poppy seeds. This sauce would then be served with freshly caught fish or chicken.",
    "weight": "200 g",
    "imageAlt": "Chicken Xacuti Masala Powder 200 grams",
    "imageSrc": "/images/catalog/chicken-xacuti-masala-powder-200-grams.jpg",
    "gallery": [
      "/images/catalog/chicken-xacuti-masala-powder-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6024,
    "slug": "chicken-roast-masala-powder",
    "name": "Chicken Roast Masala Powder",
    "price": 20000,
    "categorySlug": "masala",
    "shortDescription": "Goan chicken roast spices and grinded together",
    "description": "100 grams",
    "weight": "100 g",
    "imageAlt": "Chicken Roast Masala Powder",
    "imageSrc": "/images/catalog/chicken-roast-masala-powder.jpg",
    "gallery": [
      "/images/catalog/chicken-roast-masala-powder.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6023,
    "slug": "caldine-masala-powder-100-grams",
    "name": "Caldine Masala Powder 100 grams",
    "price": 20000,
    "categorySlug": "masala",
    "shortDescription": "Goan Caldine or Caldinho is a mild and delicious, yellow seafood curry made with few spices and coconut milk extract.",
    "description": "Goan Caldine or Caldinho is a mild and delicious, yellow seafood curry made with few spices and coconut milk extract.",
    "weight": "100 g",
    "imageAlt": "Caldine Masala Powder 100 grams",
    "imageSrc": "/images/catalog/caldine-masala-powder-100-grams.jpg",
    "gallery": [
      "/images/catalog/caldine-masala-powder-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6022,
    "slug": "cafreal-masala-paste-250-grams",
    "name": "Cafreal Masala Paste 250 grams",
    "price": 32500,
    "categorySlug": "masala",
    "shortDescription": "Cafreal is typically made from whole chicken legs, flavoured with the spices and herbs mentioned and then shallow fried. A spicy chicken preparation that originated from the Portug",
    "description": "Cafreal is typically made from whole chicken legs, flavoured with the spices and herbs mentioned and then shallow fried. A spicy chicken preparation that originated from the Portuguese colonies in the African continent.",
    "weight": "250 g",
    "imageAlt": "Cafreal Masala Paste 250 grams",
    "imageSrc": "/images/catalog/cafreal-masala-paste-250-grams.jpg",
    "gallery": [
      "/images/catalog/cafreal-masala-paste-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6021,
    "slug": "balchao-masala-paste-250-grams",
    "name": "Balchao Masala Paste 250 grams",
    "price": 32500,
    "categorySlug": "masala",
    "shortDescription": "Balchao refers to the method of cooking where seafood is pickled in a spicy and tangy tomato-vinegar based sauce.",
    "description": "Balchao refers to the method of cooking where seafood is pickled in a spicy and tangy tomato-vinegar based sauce.",
    "weight": "250 g",
    "imageAlt": "Balchao Masala Paste 250 grams",
    "imageSrc": "/images/catalog/balchao-masala-paste-250-grams.jpg",
    "gallery": [
      "/images/catalog/balchao-masala-paste-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 6020,
    "slug": "ambot-tik-masala-paste-250-grams",
    "name": "Ambot Tik Masala Paste 250 grams",
    "price": 32500,
    "categorySlug": "masala",
    "shortDescription": "Ambot tik is actually two words, ambot which means tangy/sour & tik which means hot/spicy in Konkani. Shark ambot tik curry is a hot and tangy, classic Goan fish curry. Pair it",
    "description": "Ambot tik is actually two words, ambot which means tangy/sour & tik which means hot/spicy in Konkani. Shark ambot tik curry is a hot and tangy, classic Goan fish curry. Pair it with some rice and some sautéed veggie for a hearty Goan fare!",
    "weight": "250 g",
    "imageAlt": "Ambot Tik Masala Paste 250 grams",
    "imageSrc": "/images/catalog/ambot-tik-masala-paste-250-grams.jpg",
    "gallery": [
      "/images/catalog/ambot-tik-masala-paste-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5985,
    "slug": "wheat-sheviyo-100-grams",
    "name": "Wheat Sheviyo 100 grams",
    "price": 21500,
    "categorySlug": "papads-pickles",
    "shortDescription": "Wheat vermicelli steamed and bound together.",
    "description": "Wheat vermicelli steamed and bound together.",
    "weight": "100 g",
    "imageAlt": "Wheat Sheviyo 100 grams",
    "imageSrc": "/images/catalog/wheat-sheviyo-100-grams.jpg",
    "gallery": [
      "/images/catalog/wheat-sheviyo-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5984,
    "slug": "onion-vaddiyo-100-grams",
    "name": "Onion Vaddiyo 100 grams",
    "price": 10000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Onion pulp dried with black gram lentil, green chillies, and spices.",
    "description": "Onion pulp dried with black gram lentil, green chillies, and spices.",
    "weight": "100 g",
    "imageAlt": "Onion Vaddiyo 100 grams",
    "imageSrc": "/images/catalog/onion-vaddiyo-100-grams.jpg",
    "gallery": [
      "/images/catalog/onion-vaddiyo-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5983,
    "slug": "kuwaale-vaddiyo-100-grams",
    "name": "Kuwaale Vaddiyo 100 grams",
    "price": 15000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Ash gourd pulp dried with black gram lentil, green chillies, and spices.",
    "description": "Ash gourd pulp dried with black gram lentil, green chillies, and spices.",
    "weight": "100 g",
    "imageAlt": "Kuwaale Vaddiyo 100 grams",
    "imageSrc": "/images/catalog/kuwaale-vaddiyo-100-grams.jpg",
    "gallery": [
      "/images/catalog/kuwaale-vaddiyo-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5982,
    "slug": "tomato-papad-50-grams",
    "name": "Tomato Papad 50 grams",
    "price": 8500,
    "categorySlug": "papads-pickles",
    "shortDescription": "Black gram lentil paste, flavoured with tomato",
    "description": "Black gram lentil paste, flavoured with tomato",
    "weight": "50 g",
    "imageAlt": "Tomato Papad 50 grams",
    "imageSrc": "/images/catalog/tomato-papad-50-grams.jpg",
    "gallery": [
      "/images/catalog/tomato-papad-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5981,
    "slug": "star-taarvoti-papad-200-grams",
    "name": "Star Taarvoti Papad 200 grams",
    "price": 12000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Made with Goan taarvoti chillies in a black gram lentil paste",
    "description": "Made with Goan taarvoti chillies in a black gram lentil paste",
    "weight": "200 g",
    "imageAlt": "Star Taarvoti Papad 200 grams",
    "imageSrc": "/images/catalog/star-taarvoti-papad-200-grams.jpg",
    "gallery": [
      "/images/catalog/star-taarvoti-papad-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5980,
    "slug": "spinach-papad-50-grams",
    "name": "Spinach Papad 50 grams",
    "price": 8500,
    "categorySlug": "papads-pickles",
    "shortDescription": "Black gram lentil paste, flavoured with spinach",
    "description": "Black gram lentil paste, flavoured with spinach",
    "weight": "50 g",
    "imageAlt": "Spinach Papad 50 grams",
    "imageSrc": "/images/catalog/spinach-papad-50-grams.jpg",
    "gallery": [
      "/images/catalog/spinach-papad-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5979,
    "slug": "sabudana-papad-50-grams",
    "name": "Sabudana Papad 50 grams",
    "price": 8500,
    "categorySlug": "papads-pickles",
    "shortDescription": "Sago papad with salt",
    "description": "Sago papad with salt",
    "weight": "50 g",
    "imageAlt": "Sabudana Papad 50 grams",
    "imageSrc": "/images/catalog/sabudana-papad-50-grams.jpg",
    "gallery": [
      "/images/catalog/sabudana-papad-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5978,
    "slug": "rice-papad-50-grams",
    "name": "Rice Papad 50 grams",
    "price": 8500,
    "categorySlug": "papads-pickles",
    "shortDescription": "Grounded rice paste with added spices",
    "description": "Grounded rice paste with added spices",
    "weight": "50 g",
    "imageAlt": "Rice Papad 50 grams",
    "imageSrc": "/images/catalog/rice-papad-50-grams.jpg",
    "gallery": [
      "/images/catalog/rice-papad-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5977,
    "slug": "red-chilli-papad-50-grams",
    "name": "Red Chilli Papad 50 grams",
    "price": 8500,
    "categorySlug": "papads-pickles",
    "shortDescription": "Black gram lentil paste, flavoured with red chilli",
    "description": "Black gram lentil paste, flavoured with red chilli",
    "weight": "50 g",
    "imageAlt": "Red Chilli Papad 50 grams",
    "imageSrc": "/images/catalog/red-chilli-papad-50-grams.jpg",
    "gallery": [
      "/images/catalog/red-chilli-papad-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5976,
    "slug": "jeera-papad-50-grams",
    "name": "Jeera Papad 50 grams",
    "price": 8500,
    "categorySlug": "papads-pickles",
    "shortDescription": "Black gram lentil paste, flavoured with cumin",
    "description": "Black gram lentil paste, flavoured with cumin",
    "weight": "50 g",
    "imageAlt": "Jeera Papad 50 grams",
    "imageSrc": "/images/catalog/jeera-papad-50-grams.jpg",
    "gallery": [
      "/images/catalog/jeera-papad-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5975,
    "slug": "green-chilli-papad-50-grams",
    "name": "Green Chilli Papad 50 grams",
    "price": 8500,
    "categorySlug": "papads-pickles",
    "shortDescription": "Black gram lentil paste, flavoured with green chilli",
    "description": "Black gram lentil paste, flavoured with green chilli",
    "weight": "50 g",
    "imageAlt": "Green Chilli Papad 50 grams",
    "imageSrc": "/images/catalog/green-chilli-papad-50-grams.jpg",
    "gallery": [
      "/images/catalog/green-chilli-papad-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5974,
    "slug": "garlic-papad-50-grams",
    "name": "Garlic Papad 50 grams",
    "price": 8500,
    "categorySlug": "papads-pickles",
    "shortDescription": "Black gram lentil paste, flavoured with garlic",
    "description": "Black gram lentil paste, flavoured with garlic",
    "weight": "50 g",
    "imageAlt": "Garlic Papad 50 grams",
    "imageSrc": "/images/catalog/garlic-papad-50-grams.jpg",
    "gallery": [
      "/images/catalog/garlic-papad-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5973,
    "slug": "water-mango-pickle-300-grams",
    "name": "Water Mango Pickle 300 grams",
    "price": 27000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Raw mangoes stored in salt water in earthen pots.",
    "description": "Raw mangoes stored in salt water in earthen pots.",
    "weight": "300 g",
    "imageAlt": "Water Mango Pickle 300 grams",
    "imageSrc": "/images/catalog/water-mango-pickle-300-grams.jpg",
    "gallery": [
      "/images/catalog/water-mango-pickle-300-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5972,
    "slug": "tendli-pickle-200-grams",
    "name": "Tendli Pickle 200 grams",
    "price": 19000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Ivy Gourd marinated with spices and masala in oil. Pungent yet tangy with a hint of sweetness",
    "description": "Ivy Gourd marinated with spices and masala in oil. Pungent yet tangy with a hint of sweetness",
    "weight": "200 g",
    "imageAlt": "Tendli Pickle 200 grams",
    "imageSrc": "/images/catalog/tendli-pickle-200-grams.jpg",
    "gallery": [
      "/images/catalog/tendli-pickle-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5971,
    "slug": "stuffed-mango-pickle-300-grams",
    "name": "Stuffed Mango Pickle 300 grams",
    "price": 26000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Raw mangoes stuffed with yellow mustard and other spices, soaked in oil.",
    "description": "Raw mangoes stuffed with yellow mustard and other spices, soaked in oil.",
    "weight": "300 g",
    "imageAlt": "Stuffed Mango Pickle 300 grams",
    "imageSrc": "/images/catalog/stuffed-mango-pickle-300-grams.jpg",
    "gallery": [
      "/images/catalog/stuffed-mango-pickle-300-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5970,
    "slug": "starfruit-pickle-200-grams",
    "name": "Starfruit Pickle 200 grams",
    "price": 18000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Starfruit pieces with salt, seeds, spice powders, and mustard oil all coming together to form the defining flavours of this pickle.",
    "description": "Starfruit pieces with salt, seeds, spice powders, and mustard oil all coming together to form the defining flavours of this pickle.",
    "weight": "200 g",
    "imageAlt": "Starfruit Pickle 200 grams",
    "imageSrc": "/images/catalog/starfruit-pickle-200-grams.jpg",
    "gallery": [
      "/images/catalog/starfruit-pickle-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5969,
    "slug": "prawn-balchao-pickle-250-grams",
    "name": "Prawn Balchao Pickle 250 grams",
    "price": 66000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Dried prawns marinated in balchao masala and vinegar.",
    "description": "Dried prawns marinated in balchao masala and vinegar.",
    "weight": "250 g",
    "imageAlt": "Prawn Balchao Pickle 250 grams",
    "imageSrc": "/images/catalog/prawn-balchao-pickle-250-grams.jpg",
    "gallery": [
      "/images/catalog/prawn-balchao-pickle-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5968,
    "slug": "mango-pickle-200-grams",
    "name": "Mango Pickle 200 grams",
    "price": 18000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Raw mangoes cut into smaller pieces with added spices and oil.",
    "description": "Raw mangoes cut into smaller pieces with added spices and oil.",
    "weight": "200 g",
    "imageAlt": "Mango Pickle 200 grams",
    "imageSrc": "/images/catalog/mango-pickle-200-grams.jpg",
    "gallery": [
      "/images/catalog/mango-pickle-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5967,
    "slug": "mackarel-mol-pickle-250-grams",
    "name": "Mackarel Mol Pickle 250 grams",
    "price": 66000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Mackerels cut into pieces with and marinated with spices and vinegar",
    "description": "Mackerels cut into pieces with and marinated with spices and vinegar",
    "weight": "250 g",
    "imageAlt": "Mackarel Mol Pickle 250 grams",
    "imageSrc": "/images/catalog/mackarel-mol-pickle-250-grams.jpg",
    "gallery": [
      "/images/catalog/mackarel-mol-pickle-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5966,
    "slug": "lemon-pickle-200-grams",
    "name": "Lemon Pickle 200 grams",
    "price": 21000,
    "categorySlug": "papads-pickles",
    "shortDescription": "A tangy pickle made with sundried lemons and spices in oil",
    "description": "A tangy pickle made with sundried lemons and spices in oil",
    "weight": "200 g",
    "imageAlt": "Lemon Pickle 200 grams",
    "imageSrc": "/images/catalog/lemon-pickle-200-grams.jpg",
    "gallery": [
      "/images/catalog/lemon-pickle-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5965,
    "slug": "kingfish-balchao-pickle-250-grams",
    "name": "Kingfish Balchao Pickle 250 grams",
    "price": 66000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Kingfish marinated with balchao masala.",
    "description": "Kingfish marinated with balchao masala.",
    "weight": "250 g",
    "imageAlt": "Kingfish Balchao Pickle 250 grams",
    "imageSrc": "/images/catalog/kingfish-balchao-pickle-250-grams.jpg",
    "gallery": [
      "/images/catalog/kingfish-balchao-pickle-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5964,
    "slug": "jackfruit-pickle-200-grams",
    "name": "Jackfruit Pickle 200 grams",
    "price": 24000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Raw jackfruit pulp cut into smaller pieces and marinated in spices and oil",
    "description": "Raw jackfruit pulp cut into smaller pieces and marinated in spices and oil",
    "weight": "200 g",
    "imageAlt": "Jackfruit Pickle 200 grams",
    "imageSrc": "/images/catalog/jackfruit-pickle-200-grams.jpg",
    "gallery": [
      "/images/catalog/jackfruit-pickle-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5941,
    "slug": "fresh-turmeric-pickle-200-grams",
    "name": "Fresh Turmeric Pickle 200 grams",
    "price": 21000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Raw turmeric cut into small pieces and marinated with spices in oil.",
    "description": "Raw turmeric cut into small pieces and marinated with spices in oil.",
    "weight": "200 g",
    "imageAlt": "Fresh Turmeric Pickle 200 grams",
    "imageSrc": "/images/catalog/fresh-turmeric-pickle-200-grams.jpg",
    "gallery": [
      "/images/catalog/fresh-turmeric-pickle-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5940,
    "slug": "chilli-lemon-pickle-200-grams",
    "name": "Chilli Lemon Pickle 200 grams",
    "price": 21000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Chilli and lemon with added spices for a tangy and hot flavour with oil.",
    "description": "Chilli and lemon with added spices for a tangy and hot flavour with oil.",
    "weight": "200 g",
    "imageAlt": "Chilli Lemon Pickle 200 grams",
    "imageSrc": "/images/catalog/chilli-lemon-pickle-200-grams.jpg",
    "gallery": [
      "/images/catalog/chilli-lemon-pickle-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5939,
    "slug": "brinjal-pickle-200-grams",
    "name": "Brinjal Pickle 200 grams",
    "price": 19000,
    "categorySlug": "papads-pickles",
    "shortDescription": "A unique sweet and spicy pickle blending aubergines with authentic spices",
    "description": "A unique sweet and spicy pickle blending aubergines with authentic spices",
    "weight": "200 g",
    "imageAlt": "Brinjal Pickle 200 grams",
    "imageSrc": "/images/catalog/brinjal-pickle-200-grams.jpg",
    "gallery": [
      "/images/catalog/brinjal-pickle-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5938,
    "slug": "bombil-pickle-250-grams",
    "name": "Bombil Pickle 250 grams",
    "price": 66000,
    "categorySlug": "papads-pickles",
    "shortDescription": "Bombay duck fish marinated in spices and oil.",
    "description": "Bombay duck fish marinated in spices and oil.",
    "weight": "250 g",
    "imageAlt": "Bombil Pickle 250 grams",
    "imageSrc": "/images/catalog/bombil-pickle-250-grams.jpg",
    "gallery": [
      "/images/catalog/bombil-pickle-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5932,
    "slug": "bimbli-pickle-200-grams",
    "name": "Bimbli Pickle 200 grams",
    "price": 15000,
    "categorySlug": "papads-pickles",
    "shortDescription": "A sweet sour preparation with jaggery.",
    "description": "A sweet sour preparation with jaggery.",
    "weight": "200 g",
    "imageAlt": "Bimbli Pickle 200 grams",
    "imageSrc": "/images/catalog/bimbli-pickle-200-grams.jpg",
    "gallery": [
      "/images/catalog/bimbli-pickle-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5930,
    "slug": "tirphal-50-grams",
    "name": "Tirphal 50 grams",
    "price": 8000,
    "categorySlug": "spices",
    "shortDescription": "Indian Sichuan Pepper is known for its signature taste, tingling aftertaste, unique flavour and aroma (without which some delicacies would never taste the same) makes this spice st",
    "description": "Indian Sichuan Pepper is known for its signature taste, tingling aftertaste, unique flavour and aroma (without which some delicacies would never taste the same) makes this spice stand out amongst other popular spices.",
    "weight": "50 g",
    "imageAlt": "Tirphal 50 grams",
    "imageSrc": "/images/catalog/tirphal-50-grams.jpg",
    "gallery": [
      "/images/catalog/tirphal-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5928,
    "slug": "tamarind-salt-balls",
    "name": "Tamarind Salt Balls",
    "price": 8500,
    "categorySlug": "spices",
    "shortDescription": "Unseeded tamarind wrapped in sea salt",
    "description": "Unseeded tamarind wrapped in sea salt",
    "weight": "One piece",
    "imageAlt": "Tamarind Salt Balls",
    "imageSrc": "/images/catalog/tamarind-salt-balls.jpg",
    "gallery": [
      "/images/catalog/tamarind-salt-balls.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5926,
    "slug": "stuffed-curd-chilli",
    "name": "Stuffed Curd Chilli",
    "price": 10000,
    "categorySlug": "spices",
    "shortDescription": "Sun Dried chillies marinated in curd and stuffed with spices",
    "description": "Sun Dried chillies marinated in curd and stuffed with spices",
    "weight": "One piece",
    "imageAlt": "Stuffed Curd Chilli",
    "imageSrc": "/images/catalog/stuffed-curd-chilli.jpg",
    "gallery": [
      "/images/catalog/stuffed-curd-chilli.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5924,
    "slug": "pernem-red-chillies-200-grams",
    "name": "Pernem Red Chillies 200 grams",
    "price": 35000,
    "categorySlug": "spices",
    "shortDescription": "This chilli has been grown extensively in the traditional way for about 150 – 200 years and it was one of the many varieties of chilli introduced by the Portuguese 400 years ago.",
    "description": "This chilli has been grown extensively in the traditional way for about 150 – 200 years and it was one of the many varieties of chilli introduced by the Portuguese 400 years ago.",
    "weight": "200 g",
    "imageAlt": "Pernem Red Chillies 200 grams",
    "imageSrc": "/images/catalog/pernem-red-chillies-200-grams.jpg",
    "gallery": [
      "/images/catalog/pernem-red-chillies-200-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5922,
    "slug": "mango-sola-100-grams",
    "name": "Mango Sola 100 grams",
    "price": 18000,
    "categorySlug": "spices",
    "shortDescription": "Raw mango pulp dried and used in curries",
    "description": "Raw mango pulp dried and used in curries",
    "weight": "100 g",
    "imageAlt": "Mango Sola 100 grams",
    "imageSrc": "/images/catalog/mango-sola-100-grams.jpg",
    "gallery": [
      "/images/catalog/mango-sola-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5920,
    "slug": "mango-padde-250-grams",
    "name": "Mango Padde 250 grams",
    "price": 70000,
    "categorySlug": "spices",
    "shortDescription": "Sun Dried mango seeds used in curries for tangy taste",
    "description": "Sun Dried mango seeds used in curries for tangy taste",
    "weight": "250 g",
    "imageAlt": "Mango Padde 250 grams",
    "imageSrc": "/images/catalog/mango-padde-250-grams.jpg",
    "gallery": [
      "/images/catalog/mango-padde-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5917,
    "slug": "kokum-sola-400-grams",
    "name": "Kokum Sola 400 grams",
    "price": 60000,
    "categorySlug": "spices",
    "shortDescription": "Sun dried peels of the Garcinia indica fruit. The outer cover of the fruit is dipped in the fruit juice and sun dried to make sola. Sola are sour, have a dark red colour and impart",
    "description": "Sun dried peels of the Garcinia indica fruit. The outer cover of the fruit is dipped in the fruit juice and sun dried to make sola. Sola are sour, have a dark red colour and impart the same colour to all dishes they are added to.",
    "weight": "400 g",
    "imageAlt": "Kokum Sola 400 grams",
    "imageSrc": "/images/catalog/kokum-sola-400-grams.jpg",
    "gallery": [
      "/images/catalog/kokum-sola-400-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5916,
    "slug": "cold-pressed-virgin-coconut-oil-200-ml",
    "name": "Cold Pressed Virgin Coconut Oil 200 ml",
    "price": 25000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Extracted from fresh coconut milk and 100% natural. Includes saturated fat which enhances good cholesterol in the body.",
    "description": "Extracted from fresh coconut milk and 100% natural. Includes saturated fat which enhances good cholesterol in the body.",
    "weight": "200 ml",
    "imageAlt": "Cold Pressed Virgin Coconut Oil 200 ml",
    "imageSrc": "/images/catalog/cold-pressed-virgin-coconut-oil-200-ml.jpg",
    "gallery": [
      "/images/catalog/cold-pressed-virgin-coconut-oil-200-ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5913,
    "slug": "curd-chilli",
    "name": "Curd Chilli",
    "price": 10000,
    "categorySlug": "spices",
    "shortDescription": "Green chillies sun dried and marinated with curd",
    "description": "Green chillies sun dried and marinated with curd",
    "weight": "One piece",
    "imageAlt": "Curd Chilli",
    "imageSrc": "/images/catalog/curd-chilli.jpg",
    "gallery": [
      "/images/catalog/curd-chilli.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5914,
    "slug": "narla-cold-pressed-virgin-coconut-oil-500ml",
    "name": "Narla Cold Pressed Virgin Coconut Oil 500ml",
    "price": 50000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Extracted from fresh coconut milk and 100% natural. Includes saturated fat which enhances good cholesterol in the body.",
    "description": "Extracted from fresh coconut milk and 100% natural. Includes saturated fat which enhances good cholesterol in the body.",
    "weight": "500ml",
    "imageAlt": "Narla Cold Pressed Virgin Coconut Oil 500ml",
    "imageSrc": "/images/catalog/narla-cold-pressed-virgin-coconut-oil-500ml.jpg",
    "gallery": [
      "/images/catalog/narla-cold-pressed-virgin-coconut-oil-500ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5911,
    "slug": "old-goa-cold-pressed-coconut-oil-500ml",
    "name": "Old Goa Cold Pressed Coconut Oil 500ml",
    "price": 50000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Unrefined coconut oil is expeller pressed to retain nutrients",
    "description": "Unrefined coconut oil is expeller pressed to retain nutrients",
    "weight": "500ml",
    "imageAlt": "Old Goa Cold Pressed Coconut Oil 500ml",
    "imageSrc": "/images/catalog/old-goa-cold-pressed-coconut-oil-500ml.jpg",
    "gallery": [
      "/images/catalog/old-goa-cold-pressed-coconut-oil-500ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5909,
    "slug": "coconut-jaggery-powder-250-grams",
    "name": "Coconut Jaggery Powder 250 grams",
    "price": 8500,
    "categorySlug": "spices",
    "shortDescription": "Coconut Jaggery grinded into a powder form. This product is loaded with antioxidants and minerals like zinc and selenium, which help prevent free-radicals (responsible for early ag",
    "description": "Coconut Jaggery grinded into a powder form. This product is loaded with antioxidants and minerals like zinc and selenium, which help prevent free-radicals (responsible for early ageing). It helps boost resistance against infections, hence building stronger immunity",
    "weight": "250 g",
    "imageAlt": "Coconut Jaggery Powder 250 grams",
    "imageSrc": "/images/catalog/coconut-jaggery-powder-250-grams.jpg",
    "gallery": [
      "/images/catalog/coconut-jaggery-powder-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5910,
    "slug": "mulgao-verde-virgin-coconut-oil-250ml",
    "name": "Mulgao Verde Virgin Coconut Oil 250ml",
    "price": 82500,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Extracted from fresh coconut milk and 100% natural. Includes saturated fat which enhances good cholesterol in the body.",
    "description": "Extracted from fresh coconut milk and 100% natural. Includes saturated fat which enhances good cholesterol in the body.",
    "weight": "250ml",
    "imageAlt": "Mulgao Verde Virgin Coconut Oil 250ml",
    "imageSrc": "/images/catalog/mulgao-verde-virgin-coconut-oil-250ml.jpg",
    "gallery": [
      "/images/catalog/mulgao-verde-virgin-coconut-oil-250ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5907,
    "slug": "mulgao-verde-virgin-coconut-oil-100ml",
    "name": "Mulgao Verde Virgin Coconut Oil 100ml",
    "price": 35000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Extracted from fresh coconut milk and 100% natural. Includes saturated fat which enhances good cholesterol in the body.",
    "description": "Extracted from fresh coconut milk and 100% natural. Includes saturated fat which enhances good cholesterol in the body.",
    "weight": "100ml",
    "imageAlt": "Mulgao Verde Virgin Coconut Oil 100ml",
    "imageSrc": "/images/catalog/mulgao-verde-virgin-coconut-oil-100ml.jpg",
    "gallery": [
      "/images/catalog/mulgao-verde-virgin-coconut-oil-100ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5906,
    "slug": "coconut-jaggery-blocks-500-grams",
    "name": "Coconut Jaggery Blocks 500 grams",
    "price": 24000,
    "categorySlug": "spices",
    "shortDescription": "Coconut Jaggery made into small blocks. This product is loaded with antioxidants and minerals like zinc and selenium, which help prevent free-radicals (responsible for early ageing",
    "description": "Coconut Jaggery made into small blocks. This product is loaded with antioxidants and minerals like zinc and selenium, which help prevent free-radicals (responsible for early ageing). It helps boost resistance against infections, hence building stronger immunity.",
    "weight": "500 g",
    "imageAlt": "Coconut Jaggery Blocks 500 grams",
    "imageSrc": "/images/catalog/coconut-jaggery-blocks-500-grams.jpg",
    "gallery": [
      "/images/catalog/coconut-jaggery-blocks-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5905,
    "slug": "kokamrut-kokum-syrup-500-ml",
    "name": "Kokamrut Kokum Syrup 500 ml",
    "price": 14500,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Kokum juice concentrates with added sugar and salt.",
    "description": "Kokum juice concentrates with added sugar and salt.",
    "weight": "500 ml",
    "imageAlt": "Kokamrut Kokum Syrup 500 ml",
    "imageSrc": "/images/catalog/kokamrut-kokum-syrup-500-ml.jpg",
    "gallery": [
      "/images/catalog/kokamrut-kokum-syrup-500-ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5903,
    "slug": "black-pepper-50-grams",
    "name": "Black Pepper 50 grams",
    "price": 9500,
    "categorySlug": "spices",
    "shortDescription": "Black pepper is native to the coastal region of Goa and is one of the earliest spices known. Widely used as a spice around the world, pepper also has a limited usage in medicine as",
    "description": "Black pepper is native to the coastal region of Goa and is one of the earliest spices known. Widely used as a spice around the world, pepper also has a limited usage in medicine as a carminative and stimulant of gastric secretions.",
    "weight": "50 g",
    "imageAlt": "Black Pepper 50 grams",
    "imageSrc": "/images/catalog/black-pepper-50-grams.jpg",
    "gallery": [
      "/images/catalog/black-pepper-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5902,
    "slug": "kokamrut-kokum-aagal-500-ml",
    "name": "Kokamrut Kokum Aagal 500 ml",
    "price": 12500,
    "categorySlug": "oils-vinegars",
    "shortDescription": "The pure unsweetened extract of the Kokum fruit or Garcinia Indica. Its liquid consistency makes it easy to use. A spoonful is enough to add tang to curry and sherbet.",
    "description": "The pure unsweetened extract of the Kokum fruit or Garcinia Indica. Its liquid consistency makes it easy to use. A spoonful is enough to add tang to curry and sherbet.",
    "weight": "500 ml",
    "imageAlt": "Kokamrut Kokum Aagal 500 ml",
    "imageSrc": "/images/catalog/kokamrut-kokum-aagal-500-ml.jpg",
    "gallery": [
      "/images/catalog/kokamrut-kokum-aagal-500-ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5900,
    "slug": "fresh-kokum-aagal-500-ml",
    "name": "Fresh Kokum Aagal 500 ml",
    "price": 22000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "The pure unsweetened extract of the Kokum fruit or Garcinia Indica. Its liquid consistency makes it easy to use. A spoonful is enough to add tang to curry and sherbet.",
    "description": "The pure unsweetened extract of the Kokum fruit or Garcinia Indica. Its liquid consistency makes it easy to use. A spoonful is enough to add tang to curry and sherbet.",
    "weight": "500 ml",
    "imageAlt": "Fresh Kokum Aagal 500 ml",
    "imageSrc": "/images/catalog/fresh-kokum-aagal-500-ml.jpg",
    "gallery": [
      "/images/catalog/fresh-kokum-aagal-500-ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5898,
    "slug": "atom-sola-50-grams",
    "name": "Atom Sola 50 grams",
    "price": 14000,
    "categorySlug": "spices",
    "shortDescription": "A seeded fruit like kokum, dried and used for the sour taste in curries.",
    "description": "A seeded fruit like kokum, dried and used for the sour taste in curries.",
    "weight": "50 g",
    "imageAlt": "Atom Sola 50 grams",
    "imageSrc": "/images/catalog/atom-sola-50-grams.jpg",
    "gallery": [
      "/images/catalog/atom-sola-50-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5899,
    "slug": "filtered-cooking-coconut-oil-500ml",
    "name": "Filtered Cooking Coconut Oil 500ml",
    "price": 29000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Oil extracted from sun dried coconut kernel",
    "description": "Oil extracted from sun dried coconut kernel",
    "weight": "500ml",
    "imageAlt": "Filtered Cooking Coconut Oil 500ml",
    "imageSrc": "/images/catalog/filtered-cooking-coconut-oil-500ml.jpg",
    "gallery": [
      "/images/catalog/filtered-cooking-coconut-oil-500ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5897,
    "slug": "filtered-cooking-coconut-oil-200ml",
    "name": "Filtered Cooking Coconut Oil 200ml",
    "price": 18000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Oil extracted from sun dried coconut kernel",
    "description": "Oil extracted from sun dried coconut kernel",
    "weight": "200ml",
    "imageAlt": "Filtered Cooking Coconut Oil 200ml",
    "imageSrc": "/images/catalog/filtered-cooking-coconut-oil-200ml.jpg",
    "gallery": [
      "/images/catalog/filtered-cooking-coconut-oil-200ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5896,
    "slug": "extra-virgin-coconut-oil-250ml",
    "name": "Extra Virgin Coconut Oil 250ml",
    "price": 45000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Extracted from fresh coconut milk. 100% natural and unrefined and helps regulate blood sugar.",
    "description": "Extracted from fresh coconut milk. 100% natural and unrefined and helps regulate blood sugar.",
    "weight": "250ml",
    "imageAlt": "Extra Virgin Coconut Oil 250ml",
    "imageSrc": "/images/catalog/extra-virgin-coconut-oil-250ml.jpg",
    "gallery": [
      "/images/catalog/extra-virgin-coconut-oil-250ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5884,
    "slug": "desi-cow-ghee-500-grams",
    "name": "Desi Cow Ghee 500 grams",
    "price": 55000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Highly clarified butter, which is made by churning the milk obtained from grass-fed desi cows.",
    "description": "Highly clarified butter, which is made by churning the milk obtained from grass-fed desi cows.",
    "weight": "500 g",
    "imageAlt": "Desi Cow Ghee 500 grams",
    "imageSrc": "/images/catalog/desi-cow-ghee-500-grams.jpg",
    "gallery": [
      "/images/catalog/desi-cow-ghee-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5883,
    "slug": "coconut-vinegar-500-ml",
    "name": "Coconut Vinegar 500 ml",
    "price": 20000,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Made by the fermentation process of coconut water with several health benefits such as gut health.",
    "description": "Made by the fermentation process of coconut water with several health benefits such as gut health.",
    "weight": "500 ml",
    "imageAlt": "Coconut Vinegar 500 ml",
    "imageSrc": "/images/catalog/coconut-vinegar-500-ml.jpg",
    "gallery": [
      "/images/catalog/coconut-vinegar-500-ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5879,
    "slug": "cashew-vinegar-700-ml",
    "name": "Cashew Vinegar 700 ml",
    "price": 12500,
    "categorySlug": "oils-vinegars",
    "shortDescription": "Made from real cashew, this all- natural vinegar is fermented and aged in several months to achieve the fine flavour of first class vinegar.",
    "description": "Made from real cashew, this all- natural vinegar is fermented and aged in several months to achieve the fine flavour of first class vinegar.",
    "weight": "700 ml",
    "imageAlt": "Cashew Vinegar 700 ml",
    "imageSrc": "/images/catalog/cashew-vinegar-700-ml.jpg",
    "gallery": [
      "/images/catalog/cashew-vinegar-700-ml.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5773,
    "slug": "mango-saat",
    "name": "Mango Saat",
    "price": 12000,
    "categorySlug": "sweet",
    "shortDescription": "Flattened and sun dried mango pulp",
    "description": "Flattened and sun dried mango pulp",
    "weight": "One piece",
    "imageAlt": "Mango Saat",
    "imageSrc": "/images/catalog/mango-saat.jpg",
    "gallery": [
      "/images/catalog/mango-saat.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5772,
    "slug": "mango-bites",
    "name": "Mango Bites",
    "price": 12000,
    "categorySlug": "sweet",
    "shortDescription": "Bites of alphonso mango pulp",
    "description": "Bites of alphonso mango pulp",
    "weight": "One piece",
    "imageAlt": "Mango Bites",
    "imageSrc": "/images/catalog/mango-bites.jpg",
    "gallery": [
      "/images/catalog/mango-bites.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5771,
    "slug": "mango-bar",
    "name": "Mango Bar",
    "price": 8000,
    "categorySlug": "sweet",
    "shortDescription": "Sliced alphonso mango pulp",
    "description": "per pack",
    "weight": "One piece",
    "imageAlt": "Mango Bar",
    "imageSrc": "/images/catalog/mango-bar.jpg",
    "gallery": [
      "/images/catalog/mango-bar.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5765,
    "slug": "zuzoops-100-grams",
    "name": "Zuzoops 100 grams",
    "price": 6000,
    "categorySlug": "sweet",
    "shortDescription": "Assorted fruit pulps, coated with sugar",
    "description": "Assorted fruit pulps, coated with sugar",
    "weight": "100 g",
    "imageAlt": "Zuzoops 100 grams",
    "imageSrc": "/images/catalog/zuzoops-100-grams.jpg",
    "gallery": [
      "/images/catalog/zuzoops-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5764,
    "slug": "sugar-boondi-ladoo",
    "name": "Sugar Boondi Ladoo",
    "price": 5000,
    "categorySlug": "sweet",
    "shortDescription": "Gram flour drops hard-bound with sugar",
    "description": "Gram flour drops hard-bound with sugar",
    "weight": "One piece",
    "imageAlt": "Sugar Boondi Ladoo",
    "imageSrc": "/images/catalog/sugar-boondi-ladoo.jpg",
    "gallery": [
      "/images/catalog/sugar-boondi-ladoo.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5763,
    "slug": "shev-ladoo",
    "name": "Shev Ladoo",
    "price": 5000,
    "categorySlug": "sweet",
    "shortDescription": "Gram flour bound with jaggery",
    "description": "per pack",
    "weight": "One piece",
    "imageAlt": "Shev Ladoo",
    "imageSrc": "/images/catalog/shev-ladoo.jpg",
    "gallery": [
      "/images/catalog/shev-ladoo.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5762,
    "slug": "rum-038-raisin-cake-500-grams",
    "name": "Rum & Raisin Cake 500 grams",
    "price": 60000,
    "categorySlug": "sweet",
    "shortDescription": "Raisins and nuts soaked in rum, a festive Christmas cake",
    "description": "Raisins and nuts soaked in rum, a festive Christmas cake",
    "weight": "500 g",
    "imageAlt": "Rum & Raisin Cake 500 grams",
    "imageSrc": "/images/catalog/rum-038-raisin-cake-500-grams.jpg",
    "gallery": [
      "/images/catalog/rum-038-raisin-cake-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5761,
    "slug": "rose-cookies",
    "name": "Rose Cookies",
    "price": 13000,
    "categorySlug": "sweet",
    "shortDescription": "Deep fried rose cookie made with rice flour",
    "description": "Deep fried rose cookie made with rice flour",
    "weight": "One piece",
    "imageAlt": "Rose Cookies",
    "imageSrc": "/images/catalog/rose-cookies.jpg",
    "gallery": [
      "/images/catalog/rose-cookies.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5760,
    "slug": "pinaagr",
    "name": "Pinaagr",
    "price": 14500,
    "categorySlug": "sweet",
    "shortDescription": "An oval-shaped cake constituting of rice flour, coconut, and jaggery",
    "description": "An oval-shaped cake constituting of rice flour, coconut, and jaggery",
    "weight": "One piece",
    "imageAlt": "Pinaagr",
    "imageSrc": "/images/catalog/pinaagr.jpg",
    "gallery": [
      "/images/catalog/pinaagr.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5759,
    "slug": "guava-peraad-500-grams",
    "name": "Guava Peraad 500 grams",
    "price": 75000,
    "categorySlug": "sweet",
    "shortDescription": "Made with fresh Guava pulp and added sugar, a dry festive treat around Christmas",
    "description": "Made with fresh Guava pulp and added sugar, a dry festive treat around Christmas",
    "weight": "500 g",
    "imageAlt": "Guava Peraad 500 grams",
    "imageSrc": "/images/catalog/guava-peraad-500-grams.jpg",
    "gallery": [
      "/images/catalog/guava-peraad-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5758,
    "slug": "peanut-ladoo",
    "name": "Peanut Ladoo",
    "price": 5000,
    "categorySlug": "sweet",
    "shortDescription": "Roasted peanuts bound by jaggery",
    "description": "Roasted peanuts bound by jaggery",
    "weight": "One piece",
    "imageAlt": "Peanut Ladoo",
    "imageSrc": "/images/catalog/peanut-ladoo.jpg",
    "gallery": [
      "/images/catalog/peanut-ladoo.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5751,
    "slug": "khat-khate",
    "name": "Khat-khate",
    "price": 5000,
    "categorySlug": "sweet",
    "shortDescription": "Liquid jaggery with groundnuts and ginger",
    "description": "Liquid jaggery with groundnuts and ginger",
    "weight": "One piece",
    "imageAlt": "Khat-khate",
    "imageSrc": "/images/catalog/khat-khate.jpg",
    "gallery": [
      "/images/catalog/khat-khate.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5744,
    "slug": "khajjur-katli-pack-of-4",
    "name": "Khajjur katli pack of 4",
    "price": 11000,
    "categorySlug": "sweet",
    "shortDescription": "A natural pulp of dates with dry fruits",
    "description": "A natural pulp of dates with dry fruits",
    "weight": "One piece",
    "imageAlt": "Khajjur katli pack of 4",
    "imageSrc": "/images/catalog/khajjur-katli-pack-of-4.jpg",
    "gallery": [
      "/images/catalog/khajjur-katli-pack-of-4.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5741,
    "slug": "jackfruit-saat",
    "name": "Jackfruit Saat",
    "price": 14000,
    "categorySlug": "sweet",
    "shortDescription": "Flattened and sundried jackfruit pulp",
    "description": "Flattened and sundried jackfruit pulp",
    "weight": "One piece",
    "imageAlt": "Jackfruit Saat",
    "imageSrc": "/images/catalog/jackfruit-saat.jpg",
    "gallery": [
      "/images/catalog/jackfruit-saat.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5739,
    "slug": "guava-cheese-500-grams",
    "name": "Guava Cheese 500 grams",
    "price": 75000,
    "categorySlug": "sweet",
    "shortDescription": "Made with fresh Guava pulp and added sugar, a festive treat around Christmas",
    "description": "Made with fresh Guava pulp and added sugar, a festive treat around Christmas",
    "weight": "500 g",
    "imageAlt": "Guava Cheese 500 grams",
    "imageSrc": "/images/catalog/guava-cheese-500-grams.jpg",
    "gallery": [
      "/images/catalog/guava-cheese-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5737,
    "slug": "goan-khaaje-500-grams",
    "name": "Goan Khaaje 500 grams",
    "price": 36000,
    "categorySlug": "sweet",
    "shortDescription": "Gram-flour sticks fried and coated with jaggery+ginger",
    "description": "Gram-flour sticks fried and coated with jaggery+ginger",
    "weight": "500 g",
    "imageAlt": "Goan Khaaje 500 grams",
    "imageSrc": "/images/catalog/goan-khaaje-500-grams.jpg",
    "gallery": [
      "/images/catalog/goan-khaaje-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5735,
    "slug": "dodol-500-grams",
    "name": "Dodol 500 grams",
    "price": 57500,
    "categorySlug": "sweet",
    "shortDescription": "A sweet toffee-like sugar coconut-based confection",
    "description": "A sweet toffee-like sugar coconut-based confection",
    "weight": "500 g",
    "imageAlt": "Dodol 500 grams",
    "imageSrc": "/images/catalog/dodol-500-grams.jpg",
    "gallery": [
      "/images/catalog/dodol-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5732,
    "slug": "coconut-mila",
    "name": "Coconut Mila",
    "price": 7000,
    "categorySlug": "sweet",
    "shortDescription": "Grated coconut bound with black palm jaggery, sprinkled with white sesame",
    "description": "Grated coconut bound with black palm jaggery, sprinkled with white sesame",
    "weight": "One piece",
    "imageAlt": "Coconut Mila",
    "imageSrc": "/images/catalog/coconut-mila.jpg",
    "gallery": [
      "/images/catalog/coconut-mila.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5730,
    "slug": "coconut-chikki",
    "name": "Coconut Chikki",
    "price": 12000,
    "categorySlug": "sweet",
    "shortDescription": "Coconut bound with black palm jaggery, topped with a cashew",
    "description": "Coconut bound with black palm jaggery, topped with a cashew",
    "weight": "One piece",
    "imageAlt": "Coconut Chikki",
    "imageSrc": "/images/catalog/coconut-chikki.jpg",
    "gallery": [
      "/images/catalog/coconut-chikki.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5728,
    "slug": "churmuli-ladoo",
    "name": "Churmuli Ladoo",
    "price": 2500,
    "categorySlug": "sweet",
    "shortDescription": "Puffed rice bound together with jaggery",
    "description": "Puffed rice bound together with jaggery",
    "weight": "One piece",
    "imageAlt": "Churmuli Ladoo",
    "imageSrc": "/images/catalog/churmuli-ladoo.jpg",
    "gallery": [
      "/images/catalog/churmuli-ladoo.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5727,
    "slug": "sweet-potato-chips-250-grams",
    "name": "Sweet Potato Chips 250 grams",
    "price": 36000,
    "categorySlug": "farsaan",
    "shortDescription": "Sweet potatoes sliced, salted and fried",
    "description": "Sweet potatoes sliced, salted and fried",
    "weight": "250 g",
    "imageAlt": "Sweet Potato Chips 250 grams",
    "imageSrc": "/images/catalog/sweet-potato-chips-250-grams.jpg",
    "gallery": [
      "/images/catalog/sweet-potato-chips-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5726,
    "slug": "spicy-mini-chakli-100-grams",
    "name": "Spicy mini chakli 100 grams",
    "price": 12000,
    "categorySlug": "farsaan",
    "shortDescription": "Gram flour made into small spirals mixed with spices and fried",
    "description": "Gram flour made into small spirals mixed with spices and fried",
    "weight": "100 g",
    "imageAlt": "Spicy mini chakli 100 grams",
    "imageSrc": "/images/catalog/spicy-mini-chakli-100-grams.jpg",
    "gallery": [
      "/images/catalog/spicy-mini-chakli-100-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5725,
    "slug": "spicy-corn-churma-300-grams",
    "name": "Spicy Corn Churma 300 grams",
    "price": 51000,
    "categorySlug": "farsaan",
    "shortDescription": "Cornflakes mixed with dry fruits and herbs, bound with jaggery",
    "description": "Cornflakes mixed with dry fruits and herbs, bound with jaggery",
    "weight": "300 g",
    "imageAlt": "Spicy Corn Churma 300 grams",
    "imageSrc": "/images/catalog/spicy-corn-churma-300-grams.jpg",
    "gallery": [
      "/images/catalog/spicy-corn-churma-300-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5720,
    "slug": "cashew-ladoo",
    "name": "Cashew Ladoo",
    "price": 12000,
    "categorySlug": "sweet",
    "shortDescription": "Broken cashew pieces bound with sugar",
    "description": "Broken cashew pieces bound with sugar",
    "weight": "One piece",
    "imageAlt": "Cashew Ladoo",
    "imageSrc": "/images/catalog/cashew-ladoo.jpg",
    "gallery": [
      "/images/catalog/cashew-ladoo.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5718,
    "slug": "spicy-besan-chakli-250-grams",
    "name": "Spicy besan chakli 250 grams",
    "price": 18000,
    "categorySlug": "farsaan",
    "shortDescription": "Gram flour mixed with spices and fried",
    "description": "Gram flour mixed with spices and fried",
    "weight": "250 g",
    "imageAlt": "Spicy besan chakli 250 grams",
    "imageSrc": "/images/catalog/spicy-besan-chakli-250-grams.jpg",
    "gallery": [
      "/images/catalog/spicy-besan-chakli-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5716,
    "slug": "bolacho-corpial",
    "name": "Bolacho Corpial",
    "price": 13000,
    "categorySlug": "sweet",
    "shortDescription": "Thin and crispy coconut biscuits, perfect to accompany your evening cuppa",
    "description": "Thin and crispy coconut biscuits, perfect to accompany your evening cuppa",
    "weight": "One piece",
    "imageAlt": "Bolacho Corpial",
    "imageSrc": "/images/catalog/bolacho-corpial.jpg",
    "gallery": [
      "/images/catalog/bolacho-corpial.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5714,
    "slug": "bol",
    "name": "Bol",
    "price": 7500,
    "categorySlug": "sweet",
    "shortDescription": "A baked sweet constituting of coconut jaggery and semolina",
    "description": "A baked sweet constituting of coconut jaggery and semolina",
    "weight": "One piece",
    "imageAlt": "Bol",
    "imageSrc": "/images/catalog/bol.jpg",
    "gallery": [
      "/images/catalog/bol.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5712,
    "slug": "salted-goan-cashews-500-grams",
    "name": "Salted Goan cashews 500 grams",
    "price": 66000,
    "categorySlug": "farsaan",
    "shortDescription": "Cashews grown in the heart of Goa and salted using the drum-rolling process.",
    "description": "Cashews grown in the heart of Goa and salted using the drum-rolling process.",
    "weight": "500 g",
    "imageAlt": "Salted Goan cashews 500 grams",
    "imageSrc": "/images/catalog/salted-goan-cashews-500-grams.jpg",
    "gallery": [
      "/images/catalog/salted-goan-cashews-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5708,
    "slug": "bebinca-500-grams",
    "name": "Bebinca 500 grams",
    "price": 57500,
    "categorySlug": "sweet",
    "shortDescription": "A festive layered cake of Indo-Portuguese cuisine, constituting of coconut milk, flour, eggs, and butter",
    "description": "A festive layered cake of Indo-Portuguese cuisine, constituting of coconut milk, flour, eggs, and butter",
    "weight": "500 g",
    "imageAlt": "Bebinca 500 grams",
    "imageSrc": "/images/catalog/bebinca-500-grams.jpg",
    "gallery": [
      "/images/catalog/bebinca-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5709,
    "slug": "pohe-churma-ladoo",
    "name": "Pohe Churma Ladoo",
    "price": 12000,
    "categorySlug": "farsaan",
    "shortDescription": "Flattened rice mixed with dry fruits and herbs, bound with jaggery",
    "description": "Flattened rice mixed with dry fruits and herbs, bound with jaggery",
    "weight": "One piece",
    "imageAlt": "Pohe Churma Ladoo",
    "imageSrc": "/images/catalog/pohe-churma-ladoo.jpg",
    "gallery": [
      "/images/catalog/pohe-churma-ladoo.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5705,
    "slug": "plain-goan-cashews-500-grams",
    "name": "Plain goan cashews 500 grams",
    "price": 57000,
    "categorySlug": "farsaan",
    "shortDescription": "Cashews grown in the heart of Goa",
    "description": "Cashews grown in the heart of Goa",
    "weight": "500 g",
    "imageAlt": "Plain goan cashews 500 grams",
    "imageSrc": "/images/catalog/plain-goan-cashews-500-grams.jpg",
    "gallery": [
      "/images/catalog/plain-goan-cashews-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5697,
    "slug": "aataa-rings",
    "name": "Aataa Rings",
    "price": 7500,
    "categorySlug": "sweet",
    "shortDescription": "Rings made of wheat flour and sugar, fried in oil",
    "description": "Rings made of wheat flour and sugar, fried in oil",
    "weight": "One piece",
    "imageAlt": "Aataa Rings",
    "imageSrc": "/images/catalog/aataa-rings.jpg",
    "gallery": [
      "/images/catalog/aataa-rings.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5703,
    "slug": "moong-chakli-250-grams",
    "name": "Moong Chakli 250 grams",
    "price": 28000,
    "categorySlug": "farsaan",
    "shortDescription": "Green Gram lentil with spices, fried in oil",
    "description": "Green Gram lentil with spices, fried in oil",
    "weight": "250 g",
    "imageAlt": "Moong Chakli 250 grams",
    "imageSrc": "/images/catalog/moong-chakli-250-grams.jpg",
    "gallery": [
      "/images/catalog/moong-chakli-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5700,
    "slug": "masala-phenori-500-grams",
    "name": "Masala Phenori 500 grams",
    "price": 48000,
    "categorySlug": "farsaan",
    "shortDescription": "All-purpose flour mixed with spices and fried",
    "description": "All-purpose flour mixed with spices and fried",
    "weight": "500 g",
    "imageAlt": "Masala Phenori 500 grams",
    "imageSrc": "/images/catalog/masala-phenori-500-grams.jpg",
    "gallery": [
      "/images/catalog/masala-phenori-500-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5698,
    "slug": "butter-rice-chakli-250-grams",
    "name": "Butter rice chakli 250 grams",
    "price": 18000,
    "categorySlug": "farsaan",
    "shortDescription": "Rice flour mixed with butter and salt, and fried",
    "description": "Rice flour mixed with butter and salt, and fried",
    "weight": "250 g",
    "imageAlt": "Butter rice chakli 250 grams",
    "imageSrc": "/images/catalog/butter-rice-chakli-250-grams.jpg",
    "gallery": [
      "/images/catalog/butter-rice-chakli-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5695,
    "slug": "banana-chips-in-palm-oil-250-grams",
    "name": "Banana Chips in palm oil 250 grams",
    "price": 42000,
    "categorySlug": "farsaan",
    "shortDescription": "Goan bananas cut in long shape and fried in Palm oil.",
    "description": "Goan bananas cut in long shape and fried in Palm oil.",
    "weight": "250 g",
    "imageAlt": "Banana Chips in palm oil 250 grams",
    "imageSrc": "/images/catalog/banana-chips-in-palm-oil-250-grams.jpg",
    "gallery": [
      "/images/catalog/banana-chips-in-palm-oil-250-grams.jpg"
    ],
    "inStock": true
  },
  {
    "id": 5691,
    "slug": "banana-chips-in-coconut-oil-500-grams",
    "name": "Banana chips in Coconut oil 500 grams",
    "price": 42000,
    "categorySlug": "farsaan",
    "shortDescription": "Goan bananas cut in round shape and fried in Coconut oil",
    "description": "Goan bananas cut in round shape and fried in Coconut oil",
    "weight": "500 g",
    "imageAlt": "Banana chips in Coconut oil 500 grams",
    "imageSrc": "/images/catalog/banana-chips-in-coconut-oil-500-grams.jpg",
    "gallery": [
      "/images/catalog/banana-chips-in-coconut-oil-500-grams.jpg"
    ],
    "inStock": true
  }
];

export const faqs = [
  {
    "q": "Where do your products come from?",
    "a": "Every product on our shelves is produced in Goa, made by local women-led self-help groups, home makers, and small Goan cooperatives across North and South Goa."
  },
  {
    "q": "Do you ship outside Goa?",
    "a": "Yes, we ship all across India. Packages dispatch from Fontainhas within 24 to 48 hours via our courier partners."
  },
  {
    "q": "How are shipping charges calculated?",
    "a": "Shipping is calculated based on destination pincode and total package weight at checkout. We have no hidden handling fees."
  },
  {
    "q": "How long will delivery take?",
    "a": "Deliveries within Goa usually arrive in 1–2 days. Metro cities take 3–5 business days, and the rest of India takes 4–7 business days."
  },
  {
    "q": "Are the spices and masalas authentically Goan?",
    "a": "Yes, every masala paste and powder follows traditional Goan family recipes without artificial preservatives, colors, or fillers."
  },
  {
    "q": "What is your return policy?",
    "a": "Because food and personal care items are perishable, returns are accepted only for damaged, expired, or defective items reported within 48 hours of delivery."
  },
  {
    "q": "Can I place a bulk or corporate order?",
    "a": "Yes! Hotels, corporate gifting, and event planners can submit our bulk enquiry form or reach us via phone or email."
  },
  {
    "q": "How do gift hampers work?",
    "a": "We hand-pack custom cane hampers delivered exclusively within Goa. Submit our hamper enquiry form with your Goa delivery pincode."
  },
  {
    "q": "Can I cancel my order?",
    "a": "You can cancel an order directly from your account page while it is pending payment. For paid orders, please contact the store to cancel."
  },
  {
    "q": "What payment methods do you accept?",
    "a": "We accept UPI (Google Pay, PhonePe, Paytm), credit/debit cards (Visa, Mastercard, RuPay), and Net Banking via Razorpay secure checkout."
  },
  {
    "q": "Is COD (Cash on Delivery) available?",
    "a": "Currently, all online orders require prepaid checkout via Razorpay to guarantee fresh dispatch from our Fontainhas store."
  },
  {
    "q": "Where is your physical store located?",
    "a": "We are located at Tarcar Mansion, Fontainhas, Panaji, Goa 403001, right in the heart of the historic Latin Quarter."
  },
  {
    "q": "What are your store hours?",
    "a": "We are open 7 days a week, from 9:00 AM to 9:00 PM."
  },
  {
    "q": "Are the handmade soaps all-natural?",
    "a": "Yes, our soaps are hand-crafted in small batches using pure coconut oil, besan, neem, charcoal, and natural botanical extracts."
  },
  {
    "q": "Do you sell authentic Kunbi shawls?",
    "a": "Yes, our Kunbi shelf features authentic handloom woven cotton shawls and fabrics made by Goan weavers."
  },
  {
    "q": "How should I store coconut jaggery and pastes?",
    "a": "Pure coconut jaggery and wet masala pastes (such as Cafreal, Recheado, and Ambot Tik) should be stored in a cool dry place or refrigerated after opening."
  },
  {
    "q": "Are the prices inclusive of GST?",
    "a": "Yes, all prices shown on the website include all applicable taxes."
  },
  {
    "q": "How do I track my order once shipped?",
    "a": "You will receive an email confirmation with the courier name and live tracking link as soon as your package is dispatched."
  },
  {
    "q": "How can I contact customer support?",
    "a": "You can call us at +91 80103 67153 or email us at customerservice@globaltolocal.in. We reply within 24 hours."
  }
];

export const reviews = [
  {
    "author": "Prasad Naik",
    "location": "Margao, Goa",
    "quote": "Finding true local Goan produce under one roof in Fontainhas is an absolute treasure. The cafreal paste and coconut jaggery taste exactly like home.",
    "rating": 5
  },
  {
    "author": "Ananya Deshmukh",
    "location": "Mumbai, Maharashtra",
    "quote": "Ordered the fish curry masala and bebinca to Mumbai. Everything arrived in immaculate packaging within 3 days. Beautiful initiative supporting women makers.",
    "rating": 5
  },
  {
    "author": "David & Claire",
    "location": "United Kingdom",
    "quote": "Visited the store in Panaji during our holiday and fell in love with the Kunbi shawls and handmade soaps. Now we order refills online!",
    "rating": 5
  }
];

export const makerSteps = [
  {
    "num": "01",
    "title": "The Soil & Heritage of Goa",
    "body": "From coastal coconut groves to spice farms in Ponda, every ingredient originates from Goan land and traditional methods passed down through generations."
  },
  {
    "num": "02",
    "title": "Women-Led Self-Help Groups",
    "body": "Over 80% of our products are made by women artisans, cooperatives, and micro-entrepreneurs earning sustainable livelihoods across Goan villages."
  },
  {
    "num": "03",
    "title": "Small Batches, No Fillers",
    "body": "No commercial mass processing, no artificial preservatives. Ground on stone grinders, sun-dried, and bottled fresh in small batches."
  },
  {
    "num": "04",
    "title": "Direct from Fontainhas to You",
    "body": "Carefully packed at Tarcar Mansion in Panaji's Latin Quarter and shipped directly to your door anywhere in India."
  }
];

export const videos = {
  "street": {
    "src": "/videos/street.mp4",
    "srcMobile": "/videos/street-720.mp4",
    "poster": "/videos/street-poster.jpg",
    "label": "A lane in Fontainhas, Panaji, late afternoon"
  },
  "rice": {
    "src": "/videos/rice.mp4",
    "poster": "/videos/rice-poster.jpg",
    "label": "Red rice in a cane soop"
  },
  "kunbi": {
    "src": "/videos/kunbi.mp4",
    "poster": "/videos/kunbi-poster.jpg",
    "label": "Kunbi weave on cotton"
  },
  "kokum": {
    "src": "/videos/kokum.mp4",
    "poster": "/videos/kokum-poster.jpg",
    "label": "Kokum sola on cotton"
  },
  "mitti": {
    "src": "/videos/mitti.mp4",
    "poster": "/videos/mitti-poster.jpg",
    "label": "A mitti pot on cotton"
  },
  "maker": {
    "src": "/videos/maker.mp4",
    "poster": "/videos/maker-poster.jpg",
    "label": "Hands grinding red masala"
  },
  "hamper": {
    "src": "/videos/hamper.mp4",
    "poster": "/videos/hamper-poster.jpg",
    "label": "Packing a cane basket"
  },
  "patio": {
    "src": "/videos/patio.mp4",
    "poster": "/videos/patio-poster.jpg",
    "label": "Inside the Fontainhas store"
  },
  "dusk": {
    "src": "/videos/dusk.mp4",
    "poster": "/videos/dusk-poster.jpg",
    "label": "Fontainhas at dusk, lamps in the windows"
  }
};

export function getCategoryBySlug(slug) {
  return categories.find(c => c.slug === slug);
}

export function getProductBySlug(slug) {
  return products.find(p => p.slug === slug);
}

export function getProductsByCategory(categorySlug) {
  return products.filter(p => p.categorySlug === categorySlug);
}

export function formatPrice(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
