import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASELINE_DIR = path.resolve('content-audit/baselines-part1');
const CURRENT_DIR = path.resolve('content-audit/current-check');
fs.mkdirSync(CURRENT_DIR, { recursive: true });

const TARGET_PAGES = [
  { url: 'http://localhost:5173/', name: 'home', title: 'Home' },
  { url: 'http://localhost:5173/shop', name: 'shop', title: 'Shop' },
  { url: 'http://localhost:5173/product-category/chutneys-and-spreads', name: 'category_chutneys', title: 'Category' },
  { url: 'http://localhost:5173/product/pineapple-jam-250-grams', name: 'product_pineapple_jam', title: 'Product Detail' },
];

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '360', width: 360, height: 800 },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const p of TARGET_PAGES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      
      console.log(`Navigating to ${p.url} at ${vp.width}px...`);
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(800);

      const shotName = `${p.name}_${vp.name}px.png`;
      const currentShotPath = path.join(CURRENT_DIR, shotName);
      const baselineShotPath = path.join(BASELINE_DIR, shotName);

      await page.screenshot({ path: currentShotPath, fullPage: true });

      const currentSize = fs.statSync(currentShotPath).size;
      const baselineExists = fs.existsSync(baselineShotPath);
      const baselineSize = baselineExists ? fs.statSync(baselineShotPath).size : 0;

      // Inspect DOM content
      let domInfo = {};
      if (p.name === 'home') {
        const shelvesCount = await page.locator('ul li a[href*="/product-category/"]').count();
        const heroHeading = await page.locator('h1').first().textContent().catch(() => '');
        domInfo = { shelvesCount, heroHeading: heroHeading.trim() };
      } else if (p.name === 'shop') {
        const shelfPills = await page.locator('#catalogue button[type="button"]').count();
        const productCards = await page.locator('article, .group').filter({ has: page.locator('img') }).count();
        const resultsText = await page.locator('text=/Showing \\d+ of \\d+ products/').textContent().catch(() => '');
        domInfo = { shelfPills, productCards, resultsText: resultsText.trim() };
      } else if (p.name === 'category_chutneys') {
        const categoryHeading = await page.locator('h1').textContent().catch(() => '');
        const itemsCountText = await page.locator('text=/Showing all \\d+ items on this shelf/').textContent().catch(() => '');
        domInfo = { categoryHeading: categoryHeading.trim(), itemsCountText: itemsCountText.trim() };
      } else if (p.name === 'product_pineapple_jam') {
        const productTitle = await page.locator('h1').textContent().catch(() => '');
        const priceText = await page.locator('text=/₹\\d+/').first().textContent().catch(() => '');
        domInfo = { productTitle: productTitle.trim(), priceText: priceText.trim() };
      }

      const sizeDiffPct = baselineSize ? Math.abs((currentSize - baselineSize) / baselineSize) * 100 : 0;

      results.push({
        page: p.title,
        route: p.url,
        viewport: `${vp.width}px`,
        filename: shotName,
        currentSize,
        baselineSize,
        sizeDiffPct: sizeDiffPct.toFixed(2) + '%',
        baselineExists,
        domInfo,
      });

      await context.close();
    }
  }

  await browser.close();
  console.log('\n--- VERIFICATION & COMPARISON RESULTS ---');
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(
    path.join(CURRENT_DIR, 'comparison-report.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
}

main().catch((err) => {
  console.error('Comparison script failed:', err);
  process.exit(1);
});
