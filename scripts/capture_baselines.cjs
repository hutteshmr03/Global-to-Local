const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const viewports = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 }
];

const routes = [
  { path: '/', name: 'home' },
  { path: '/shop', name: 'shop' },
  { path: '/product-category/chutneys-and-spreads', name: 'category_chutneys' },
  { path: '/product/pineapple-jam-250-grams', name: 'product_pineapple_jam' },
  { path: '/our-story', name: 'our_story' },
  { path: '/our-social-corner', name: 'our_social_corner' },
  { path: '/in-the-news', name: 'in_the_news' },
  { path: '/contact', name: 'contact' },
  { path: '/shipping-policy', name: 'shipping_policy' },
  { path: '/return-and-exchange-policy', name: 'return_policy' },
  { path: '/terms-and-conditions', name: 'terms' },
  { path: '/privacy-policy', name: 'privacy' },
];

async function main() {
  fs.mkdirSync('content-audit/baselines', { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const r of routes) {
      const url = `https://gtl-khaki.vercel.app${r.path}`;
      console.log(`Capturing ${r.name} @ ${vp.name}px (${url})...`);
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000); // Wait for fonts and hero settle
        const outPath = path.join('content-audit/baselines', `${r.name}_${vp.name}px.png`);
        await page.screenshot({ path: outPath, fullPage: true });
        console.log(`  Saved ${outPath}`);
      } catch (e) {
        console.error(`  Error capturing ${url}:`, e.message);
      }
    }
    await context.close();
  }

  await browser.close();
  console.log('All baseline screenshots captured successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
