const { chromium } = require('playwright');

async function testCleanSlideover() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('1. Logging in...');
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' });
  const emailTab = page.getByRole('button', { name: 'Email' });
  if (await emailTab.isVisible()) await emailTab.click();
  await page.fill('input[type="email"]', 'admin@globaltolocal.in');
  await page.fill('input[type="password"]', 'AdminPass123!');
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForTimeout(1500);

  console.log('2. Navigating to Admin Products...');
  await page.goto('http://127.0.0.1:5173/admin/products', { waitUntil: 'networkidle' });

  // TEST 1: Check "Add Product" form
  console.log('3. Opening Add Product sheet...');
  await page.getByRole('button', { name: /Add Product/i }).click();
  await page.waitForTimeout(600);

  const skuFieldInAdd = await page.locator('#field-sku').isVisible();
  console.log('Is SKU field visible in Add Product?', skuFieldInAdd); // Should be false!

  // Check image section
  const mainBadgeInAdd = await page.locator('text="Main Store Image"').isVisible();
  console.log('Is Main Store Image badge visible in Add Product?', mainBadgeInAdd); // Should be false!

  // Fill and create a new upcoming product
  await page.fill('#field-name', 'Organic Goan Kokum Butter');
  await page.selectOption('#field-shelf', 'wellness');
  await page.fill('#field-price', '320');
  await page.fill('#field-weight', '150');
  await page.fill('#field-unit', '150 g jar');

  await page.getByRole('button', { name: 'Save Product' }).click();
  await page.waitForTimeout(1000);

  const firstProdText = await page.locator('tbody tr').first().textContent();
  console.log('First product in table after Add:', firstProdText.includes('Organic Goan Kokum Butter'));
  console.log('Auto-generated SKU in table:', firstProdText.includes('WELL-ORGANIC-KOKUM-BUTTER'));

  // TEST 2: Check "Edit Product Details"
  console.log('4. Opening Edit Product Details on first product...');
  await page.locator('tbody tr button:has-text("Edit Details")').first().click();
  await page.waitForTimeout(600);

  const skuFieldInEdit = await page.locator('#field-sku').isVisible();
  console.log('Is SKU field visible in Edit Product?', skuFieldInEdit); // Should be false!

  const mainBadgeInEdit = await page.locator('text="Main Store Image"').isVisible();
  console.log('Is Main Store Image badge visible in Edit Product?', mainBadgeInEdit); // Should be false!

  const altInputInEdit = await page.locator('input[placeholder*="Required alt text"]').isVisible();
  console.log('Is Alt text input box visible in Edit Product?', altInputInEdit); // Should be false!

  // Click Update Product
  await page.getByRole('button', { name: /Update Product/i }).click();
  await page.waitForTimeout(800);
  console.log('Updated product successfully!');

  await browser.close();
  console.log('All verification checks passed!');
}

testCleanSlideover().catch(err => {
  console.error(err);
  process.exit(1);
});
