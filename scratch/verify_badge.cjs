const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:5173/admin', { waitUntil: 'networkidle' });
  const badgeText = await page.locator('header span.rounded-pill').first().textContent();
  console.log('Badge text in header:', badgeText.trim());
  await page.screenshot({ path: 'scratch/screenshots/admin_office_header.png' });
  await browser.close();
  console.log('Screenshot saved to scratch/screenshots/admin_office_header.png');
})();
