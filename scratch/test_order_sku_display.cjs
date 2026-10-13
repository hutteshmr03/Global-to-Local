const { chromium } = require('playwright');

async function verifyDisplay() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Login
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' });
  const emailTab = page.getByRole('button', { name: 'Email' });
  if (await emailTab.isVisible()) {
    await emailTab.click();
  }
  await page.fill('input[type="email"]', 'admin@globaltolocal.in');
  await page.fill('input[type="password"]', 'AdminPass123!');
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForTimeout(1500);

  // 2. Go to Admin Dashboard
  await page.goto('http://127.0.0.1:5173/admin', { waitUntil: 'networkidle' });

  // Verify removed subtitle
  const removedText = await page.getByText('Real-time orders placed across Pan-India and Goa Express').isVisible();
  console.log('Is removed subtitle visible on Dashboard?', removedText);

  // Check recent order IDs
  const orderIds = await page.locator('td.text-palm').allTextContents();
  console.log('Recent Order IDs on Dashboard:', orderIds);

  // 3. Go to Admin Orders
  await page.goto('http://127.0.0.1:5173/admin/orders', { waitUntil: 'networkidle' });
  const tableOrderNumbers = await page.locator('td.text-accent a').allTextContents();
  console.log('Order Numbers on Orders Page:', tableOrderNumbers);

  // 4. Go to Admin Products
  await page.goto('http://127.0.0.1:5173/admin/products', { waitUntil: 'networkidle' });
  const productSkus = await page.locator('tbody tr td p.font-sans.font-semibold.text-\\[10px\\]').allTextContents();
  console.log('Sample Product SKUs (first 8):', productSkus.slice(0, 8));

  await browser.close();
}

verifyDisplay().catch(err => {
  console.error(err);
  process.exit(1);
});
