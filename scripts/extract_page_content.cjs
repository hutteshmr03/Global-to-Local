const fs = require('fs');
const path = require('path');

// Let's inspect all chunks to find FAQs, Reviews, News, Story, Policies, Ticker, Maker steps, etc.
const chunkDir = 'content-audit/static/chunks';
const files = fs.readdirSync(chunkDir);

const chunksText = {};
for (const file of files) {
  if (file.endsWith('.js')) {
    chunksText[file] = fs.readFileSync(path.join(chunkDir, file), 'utf8');
  }
}

// Look for FAQ data or extract from contact page HTML
const contactHtml = fs.readFileSync('content-audit/pages/contact.html', 'utf8');
const ourStoryHtml = fs.readFileSync('content-audit/pages/our-story.html', 'utf8');
const ourSocialCornerHtml = fs.readFileSync('content-audit/pages/our-social-corner.html', 'utf8');
const inTheNewsHtml = fs.readFileSync('content-audit/pages/in-the-news.html', 'utf8');
const shippingHtml = fs.readFileSync('content-audit/pages/shipping-policy.html', 'utf8');
const returnHtml = fs.readFileSync('content-audit/pages/return-and-exchange-policy.html', 'utf8');
const termsHtml = fs.readFileSync('content-audit/pages/terms-and-conditions.html', 'utf8');
const privacyHtml = fs.readFileSync('content-audit/pages/privacy-policy.html', 'utf8');
const homeHtml = fs.readFileSync('content-audit/pages/home.html', 'utf8');

console.log("HTML files loaded successfully.");
