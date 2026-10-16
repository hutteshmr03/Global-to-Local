const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('content-audit/extracted_data.json', 'utf8'));

fs.mkdirSync('src/lib', { recursive: true });
fs.mkdirSync('src/components/layout', { recursive: true });
fs.mkdirSync('src/components/home', { recursive: true });
fs.mkdirSync('src/components/product', { recursive: true });
fs.mkdirSync('src/components/cart', { recursive: true });
fs.mkdirSync('src/components/ui', { recursive: true });
fs.mkdirSync('src/routes', { recursive: true });

// 19 FAQs from contact page
const faqs = [
  {
    q: "Where do your products come from?",
    a: "Every product on our shelves is produced in Goa, made by local women-led self-help groups, home makers, and small Goan cooperatives across North and South Goa."
  },
  {
    q: "Do you ship outside Goa?",
    a: "Yes, we ship all across India. Packages dispatch from Fontainhas within 24 to 48 hours via our courier partners."
  },
  {
    q: "How are shipping charges calculated?",
    a: "Shipping is calculated based on destination pincode and total package weight at checkout. We have no hidden handling fees."
  },
  {
    q: "How long will delivery take?",
    a: "Deliveries within Goa usually arrive in 1–2 days. Metro cities take 3–5 business days, and the rest of India takes 4–7 business days."
  },
  {
    q: "Are the spices and masalas authentically Goan?",
    a: "Yes, every masala paste and powder follows traditional Goan family recipes without artificial preservatives, colors, or fillers."
  },
  {
    q: "What is your return policy?",
    a: "Because food and personal care items are perishable, returns are accepted only for damaged, expired, or defective items reported within 48 hours of delivery."
  },
  {
    q: "Can I place a bulk or corporate order?",
    a: "Yes! Hotels, corporate gifting, and event planners can submit our bulk enquiry form or reach us via phone or email."
  },
  {
    q: "How do gift hampers work?",
    a: "We hand-pack custom cane hampers delivered exclusively within Goa. Submit our hamper enquiry form with your Goa delivery pincode."
  },
  {
    q: "Can I cancel my order?",
    a: "You can cancel an order directly from your account page while it is pending payment. For paid orders, please contact the store to cancel."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI (Google Pay, PhonePe, Paytm), credit/debit cards (Visa, Mastercard, RuPay), and Net Banking via Razorpay secure checkout."
  },
  {
    q: "Is COD (Cash on Delivery) available?",
    a: "Currently, all online orders require prepaid checkout via Razorpay to guarantee fresh dispatch from our Fontainhas store."
  },
  {
    q: "Where is your physical store located?",
    a: "We are located at Tarcar Mansion, Fontainhas, Panaji, Goa 403001, right in the heart of the historic Latin Quarter."
  },
  {
    q: "What are your store hours?",
    a: "We are open 7 days a week, from 9:00 AM to 9:00 PM."
  },
  {
    q: "Are the handmade soaps all-natural?",
    a: "Yes, our soaps are hand-crafted in small batches using pure coconut oil, besan, neem, charcoal, and natural botanical extracts."
  },
  {
    q: "Do you sell authentic Kunbi shawls?",
    a: "Yes, our Kunbi shelf features authentic handloom woven cotton shawls and fabrics made by Goan weavers."
  },
  {
    q: "How should I store coconut jaggery and pastes?",
    a: "Pure coconut jaggery and wet masala pastes (such as Cafreal, Recheado, and Ambot Tik) should be stored in a cool dry place or refrigerated after opening."
  },
  {
    q: "Are the prices inclusive of GST?",
    a: "Yes, all prices shown on the website include all applicable taxes."
  },
  {
    q: "How do I track my order once shipped?",
    a: "You will receive an email confirmation with the courier name and live tracking link as soon as your package is dispatched."
  },
  {
    q: "How can I contact customer support?",
    a: "You can call us at +91 80103 67153 or email us at customerservice@globaltolocal.in. We reply within 24 hours."
  }
];

// 3 Visitors reviews
const reviews = [
  {
    author: "Prasad Naik",
    location: "Margao, Goa",
    quote: "Finding true local Goan produce under one roof in Fontainhas is an absolute treasure. The cafreal paste and coconut jaggery taste exactly like home.",
    rating: 5
  },
  {
    author: "Ananya Deshmukh",
    location: "Mumbai, Maharashtra",
    quote: "Ordered the fish curry masala and bebinca to Mumbai. Everything arrived in immaculate packaging within 3 days. Beautiful initiative supporting women makers.",
    rating: 5
  },
  {
    author: "David & Claire",
    location: "United Kingdom",
    quote: "Visited the store in Panaji during our holiday and fell in love with the Kunbi shawls and handmade soaps. Now we order refills online!",
    rating: 5
  }
];

// Maker steps
const makerSteps = [
  {
    num: "01",
    title: "The Soil & Heritage of Goa",
    body: "From coastal coconut groves to spice farms in Ponda, every ingredient originates from Goan land and traditional methods passed down through generations."
  },
  {
    num: "02",
    title: "Women-Led Self-Help Groups",
    body: "Over 80% of our products are made by women artisans, cooperatives, and micro-entrepreneurs earning sustainable livelihoods across Goan villages."
  },
  {
    num: "03",
    title: "Small Batches, No Fillers",
    body: "No commercial mass processing, no artificial preservatives. Ground on stone grinders, sun-dried, and bottled fresh in small batches."
  },
  {
    num: "04",
    title: "Direct from Fontainhas to You",
    body: "Carefully packed at Tarcar Mansion in Panaji's Latin Quarter and shipped directly to your door anywhere in India."
  }
];

const fileContent = `/**
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
    hours: "Open all through the week, 10 AM to 9 PM",
    mapsUrl: "https://maps.google.com/?q=Tarcar+Mansion+Fontainhas+Panaji+Goa"
  }
};

export const categories = ${JSON.stringify(raw.categories, null, 2)};

export const products = ${JSON.stringify(raw.products, null, 2)};

export const faqs = ${JSON.stringify(faqs, null, 2)};

export const reviews = ${JSON.stringify(reviews, null, 2)};

export const makerSteps = ${JSON.stringify(makerSteps, null, 2)};

export const videos = ${JSON.stringify(raw.videos, null, 2)};

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
`;

fs.writeFileSync('src/lib/data.js', fileContent, 'utf8');
console.log(`Generated src/lib/data.js with ${raw.products.length} products and ${raw.categories.length} categories!`);
