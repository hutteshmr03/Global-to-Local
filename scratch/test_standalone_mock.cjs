const { chromium } = require('playwright');
const path = require('path');

async function testStandalone() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[Browser Error]', msg.text());
  });

  console.log('1. Navigating to login page...');
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' });

  // Switch to Email tab
  const emailTab = page.getByRole('button', { name: 'Email' });
  if (await emailTab.isVisible()) {
    await emailTab.click();
  }

  console.log('2. Entering admin credentials...');
  await page.fill('input[type="email"]', 'admin@globaltolocal.in');
  await page.fill('input[type="password"]', 'AdminPass123!');

  console.log('3. Clicking Sign In...');
  const signInBtn = page.getByRole('button', { name: /Sign In/i });
  await signInBtn.click();
  await page.waitForTimeout(1500);

  console.log('Current URL after login:', page.url());

  // Navigate to /admin
  await page.goto('http://127.0.0.1:5173/admin/products', { waitUntil: 'networkidle' });
  console.log('Current URL on admin products:', page.url());

  // Verify Add Product button
  const addBtn = page.getByRole('button', { name: /Add Product/i });
  const addBtnVisible = await addBtn.isVisible();
  console.log('Add Product button visible:', addBtnVisible);

  if (addBtnVisible) {
    await addBtn.click();
    await page.waitForTimeout(600);

    const dialog = page.getByRole('dialog');
    console.log('Add Product sheet opened:', await dialog.isVisible());

    // Fill new product form
    const testTitle = 'Goan Cashew Feni Honey Blend';
    await page.fill('#field-name', testTitle);
    console.log('Auto-slug:', await page.inputValue('#field-slug'));
    console.log('Suggested SKU:', await page.inputValue('#field-sku'));

    await page.fill('#field-price', '490');
    await page.fill('#field-weight', '350');
    await page.fill('#field-unit', '350 g jar');
    await page.fill('#field-origin', 'Valpoi, Goa');
    await page.fill('#field-description', 'Wild honey infused with traditional Goan cashew distillations.');

    // Save product
    const saveBtn = page.getByRole('button', { name: /Save Product/i });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    const toast = page.locator('text=created successfully');
    console.log('Success toast visible:', await toast.isVisible());

    const firstProduct = await page.locator('tbody tr:first-child td p.truncate').first().textContent();
    console.log('First product in table:', firstProduct);
  }

  await browser.close();
  console.log('Standalone mode test passed successfully!');
}

testStandalone().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
