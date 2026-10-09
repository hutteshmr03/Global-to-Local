const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 1. Build catalogue.csv
const data = JSON.parse(fs.readFileSync('content-audit/extracted_data.json', 'utf8'));
const products = data.products;
const categories = data.categories;

console.log(`Processing ${products.length} products and ${categories.length} categories...`);

// Helper to escape CSV fields
function csvEscape(val) {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Category map
const categoryMap = {};
categories.forEach(c => {
  categoryMap[c.slug] = c.name;
});

// CSV header:
// slug, name, shelf, price (rupees), unit label, description, maker/origin text, availability message, shipping note, image file name(s), alt text, source URL
const csvRows = [
  ['slug', 'name', 'shelf', 'price_inr', 'unit_label', 'description', 'maker_origin_text', 'availability_message', 'shipping_note', 'image_files', 'alt_text', 'source_url'].map(csvEscape).join(',')
];

const allImageUrls = new Set();
const assetManifest = [];

products.forEach(p => {
  const shelfName = categoryMap[p.categorySlug] || p.categorySlug;
  const priceInr = p.price ? (p.price / 100) : 0;
  const unitLabel = p.weight || 'One piece';
  const desc = p.description || p.shortDescription || '';
  const makerOrigin = 'Made in Goa, of Goan origin';
  const availability = p.inStock ? 'In stock and ready to ship from Fontainhas' : 'Currently out of stock';
  const shippingNote = 'Dispatches in 24–48 hours across India';
  
  const images = p.gallery && p.gallery.length > 0 ? p.gallery : (p.imageSrc ? [p.imageSrc] : []);
  const imageFileNames = images.map(img => path.basename(img)).join('; ');
  images.forEach(img => {
    allImageUrls.add(img);
    assetManifest.push({
      file: path.basename(img),
      url: 'https://gtl-khaki.vercel.app' + img,
      used_by: `Product: ${p.name} (/product/${p.slug})`,
      alt: p.imageAlt || p.name
    });
  });

  const sourceUrl = `https://globaltolocal.in/product/${p.slug}`;

  csvRows.push([
    p.slug,
    p.name,
    shelfName,
    priceInr,
    unitLabel,
    desc,
    makerOrigin,
    availability,
    shippingNote,
    imageFileNames,
    p.imageAlt || p.name,
    sourceUrl
  ].map(csvEscape).join(','));
});

fs.writeFileSync('content-audit/catalogue.csv', csvRows.join('\n'), 'utf8');
console.log(`Saved content-audit/catalogue.csv with ${products.length} products.`);

// Category images
categories.forEach(c => {
  if (c.imageSrc) {
    allImageUrls.add(c.imageSrc);
    assetManifest.push({
      file: path.basename(c.imageSrc),
      url: 'https://gtl-khaki.vercel.app' + c.imageSrc,
      used_by: `Category: ${c.name} (/product-category/${c.slug})`,
      alt: c.imageAlt || c.name
    });
  }
});

// Video posters and assets
if (data.videos) {
  Object.entries(data.videos).forEach(([k, v]) => {
    if (v.poster) {
      allImageUrls.add(v.poster);
      assetManifest.push({
        file: path.basename(v.poster),
        url: 'https://gtl-khaki.vercel.app' + v.poster,
        used_by: `Home Video Poster: ${k} (${v.label})`,
        alt: v.label
      });
    }
    if (v.src) {
      allImageUrls.add(v.src);
      assetManifest.push({
        file: path.basename(v.src),
        url: 'https://gtl-khaki.vercel.app' + v.src,
        used_by: `Home Video: ${k}`,
        alt: v.label
      });
    }
  });
}

// Additional known static assets
const extraAssets = [
  '/audio/fontainhas-street.mp3',
  '/audio/street.mp3',
  '/favicon.ico',
  '/logo.svg',
  '/images/og.jpg',
  '/images/store-front.jpg',
  '/images/hamper-basket.jpg',
  '/images/hero.jpg',
];

extraAssets.forEach(ea => {
  allImageUrls.add(ea);
  assetManifest.push({
    file: path.basename(ea),
    url: 'https://gtl-khaki.vercel.app' + ea,
    used_by: `Site Asset: ${ea}`,
    alt: ea
  });
});

fs.writeFileSync('content-audit/assets/manifest.json', JSON.stringify(assetManifest, null, 2), 'utf8');
console.log(`Saved manifest with ${assetManifest.length} entries.`);
fs.writeFileSync('content-audit/all_asset_urls.json', JSON.stringify(Array.from(allImageUrls), null, 2), 'utf8');
