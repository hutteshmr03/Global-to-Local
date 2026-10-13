const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function run() {
  const screenshotDir = path.join(__dirname, '..', 'scratch', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Generate a valid PNG image using Python Pillow
  const validPngPath = path.join(screenshotDir, 'sample_product.png');
  execSync(`python -c "from PIL import Image; img = Image.new('RGB', (400, 400), color='#006B3E'); img.save(r'${validPngPath}', format='PNG')"`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // 1. Authenticate admin via Vite proxy to set cookies on 127.0.0.1:5173
  console.log('Logging in admin via Vite proxy...');
  const apiRes = await context.request.post('http://127.0.0.1:5173/api/v1/auth/login', {
    data: {
      email: 'admin@globaltolocal.in',
      password: 'AdminPass123!',
    },
  });
  console.log('Login response status:', apiRes.status());
  const loginData = await apiRes.json();
  console.log('Admin user:', loginData.user?.email, 'role:', loginData.user?.role);

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  // Test at 1440px (Desktop)
  console.log('\n--- Testing Desktop 1440px ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/admin/products', { waitUntil: 'networkidle' });

  // Verify "Add Product" button
  const addBtn = page.getByRole('button', { name: /Add Product/i });
  console.log('Add Product button visible at 1440px:', await addBtn.isVisible());
  await page.screenshot({ path: path.join(screenshotDir, 'admin-products-1440px.png') });

  // Click Add Product
  await addBtn.click();
  await page.waitForTimeout(600);

  // Verify slide-over panel
  const panel = page.getByRole('dialog');
  console.log('Dialog visible at 1440px:', await panel.isVisible());
  await page.screenshot({ path: path.join(screenshotDir, 'admin-add-product-slideover-1440px.png') });

  // Fill in form
  const uniqueSuffix = Date.now().toString().slice(-4);
  const testName = `Artisanal Goan Kokum Vinegar ${uniqueSuffix}`;
  const testSku = `GTL-TEST-${uniqueSuffix}`;

  await page.fill('#field-name', testName);
  const slugVal = await page.inputValue('#field-slug');
  console.log('Auto-generated slug:', slugVal);

  await page.fill('#field-sku', testSku);
  await page.selectOption('#field-shelf', 'oils-vinegars');
  await page.fill('#field-price', '380');
  await page.fill('#field-weight', '500');
  await page.fill('#field-unit', '500 ml bottle');
  await page.fill('#field-origin', 'Assagao, Goa');
  await page.fill('#field-description', 'Aged traditional Goan kokum vinegar brewed in earthen vats.');

  // Upload image via input
  const fileInput = page.locator('#product-images-input');
  await fileInput.setInputFiles(validPngPath);
  await page.waitForTimeout(1200);

  const hasImage = await page.locator('text=Image #1').isVisible();
  console.log('Image uploaded and visible in form:', hasImage);

  // Fill required alt text
  const altInput = page.locator('input[placeholder*="Required alt text"]');
  if (await altInput.isVisible()) {
    await altInput.fill('Artisanal Goan Kokum Vinegar bottle against sunlight');
  }

  await page.screenshot({ path: path.join(screenshotDir, 'admin-add-product-filled-1440px.png') });

  // Click Save Product
  const saveBtn = page.getByRole('button', { name: /Save Product/i });
  await saveBtn.click();
  await page.waitForTimeout(1500);

  // Verify toast and that new product appears at top of list
  const toast = page.locator('text=created successfully');
  console.log('Success toast visible:', await toast.isVisible());
  await page.screenshot({ path: path.join(screenshotDir, 'admin-product-created-toast-1440px.png') });

  const firstProductTitle = await page.locator('tbody tr:first-child td p.truncate').first().textContent();
  console.log('First product in table:', firstProductTitle);

  // Test at 768px (Tablet)
  console.log('\n--- Testing Tablet 768px ---');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'admin-products-768px.png') });

  // Open Add Product on 768px
  await addBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'admin-add-product-768px.png') });
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(500);

  // Test at 360px (Mobile - full-screen sheet)
  console.log('\n--- Testing Mobile 360px ---');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'admin-products-360px.png') });

  // Open Add Product on 360px
  await page.getByRole('button', { name: /Add Product/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'admin-add-product-sheet-360px.png') });

  // Verify it covers full screen on 360px
  const dialogBox = await page.locator('div[role="dialog"]').boundingBox();
  console.log('Dialog dimensions on 360px:', dialogBox);

  // Close sheet
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(500);

  // Verify newly published product shows on customer /shop
  console.log('\n--- Verifying Customer Site /shop ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/shop', { waitUntil: 'networkidle' });
  const hasPublishedItem = await page.locator(`text=${testName}`).first().isVisible();
  console.log(`Product "${testName}" visible on /shop:`, hasPublishedItem);
  await page.screenshot({ path: path.join(screenshotDir, 'customer-shop-with-new-product.png') });

  await browser.close();
  console.log('\nAll Playwright UI tests completed successfully!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
