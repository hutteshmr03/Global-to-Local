const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:5173/admin/products', { waitUntil: 'networkidle' });
  await page.locator('tbody tr button:has-text("Edit Details")').first().click();
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const el = document.getElementById('product-images-input');
    if (el) el.parentElement.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scratch/screenshots/clean_edit_images.png' });
  await page.locator('button:has-text("Cancel")').click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Add Product/i }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/screenshots/clean_add_product.png' });
  await browser.close();
  console.log('Screenshots saved');
})();
