import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Navigating to Admin Login...');
  await page.goto('http://127.0.0.1:5173/login');
  await page.waitForTimeout(1000);

  // Switch to Email tab
  const emailTab = page.locator('button:has-text("Email")');
  await emailTab.first().click();
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });

  // Fill in admin credentials
  await page.fill('input[type="email"]', 'admin@globaltolocal.in');
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || '');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  console.log('2. Navigating to Admin Products...');
  await page.goto('http://127.0.0.1:5173/admin/products');
  await page.waitForSelector('tr:has-text("Aataa Rings")', { timeout: 10000 });

  // Find Aataa Rings row
  const row = page.locator('tr:has-text("Aataa Rings")').first();
  const statusButton = row.locator('button:has-text("Active"), button:has-text("Hidden")');
  let currentText = (await statusButton.innerText()).trim().toUpperCase();
  console.log('Initial Aataa Rings status button text:', currentText);

  // If currently Active, toggle to Hidden
  if (currentText.includes('ACTIVE')) {
    console.log('Toggling Aataa Rings to Hidden...');
    await statusButton.click();
    await page.waitForTimeout(2000);
    currentText = (await statusButton.innerText()).trim().toUpperCase();
  }

  console.log('Confirmed Aataa Rings is now Hidden in admin:', currentText);

  console.log('3. Checking Customer Shop Page (/shop?category=sweet)...');
  const customerPage = await context.newPage();
  await customerPage.goto('http://127.0.0.1:5173/shop?category=sweet');
  await customerPage.waitForTimeout(2000);
  const shopCards = await customerPage.locator('text="Aataa Rings"').count();
  console.log('Count of Aataa Rings visible on /shop?category=sweet:', shopCards);
  if (shopCards > 0) {
    throw new Error('FAIL: Aataa Rings is still visible on /shop while hidden!');
  }

  console.log('4. Checking Customer Category Shelf (/product-category/sweet)...');
  await customerPage.goto('http://127.0.0.1:5173/product-category/sweet');
  await customerPage.waitForTimeout(2000);
  const categoryCards = await customerPage.locator('text="Aataa Rings"').count();
  console.log('Count of Aataa Rings visible on /product-category/sweet:', categoryCards);
  if (categoryCards > 0) {
    throw new Error('FAIL: Aataa Rings is still visible on /product-category/sweet while hidden!');
  }

  console.log('5. Navigating directly to /product/aataa-rings (Direct URL visit)...');
  await customerPage.goto('http://127.0.0.1:5173/product/aataa-rings');
  await customerPage.waitForTimeout(2000);
  const pageText = await customerPage.innerText('body');
  const is404 = pageText.includes('Page Not Found') || pageText.includes('Page not found') || pageText.includes('404');
  console.log('Shows 404 / Page Not Found:', is404);
  const addToBagCount = await customerPage.locator('button:has-text("Add to Bag")').count();
  console.log('Add to Bag button count (must be 0):', addToBagCount);
  if (!is404 || addToBagCount > 0) {
    throw new Error('FAIL: Hidden product did not render NotFoundPage or showed Add to Bag button!');
  }

  console.log('6. Re-enabling Aataa Rings in Admin...');
  await page.bringToFront();
  await statusButton.click();
  await page.waitForTimeout(2000);
  const reenabledText = (await statusButton.innerText()).trim().toUpperCase();
  console.log('Status after re-enabling in admin:', reenabledText);

  console.log('7. Verifying Aataa Rings is visible again on /shop?category=sweet...');
  await customerPage.goto('http://127.0.0.1:5173/shop?category=sweet');
  await customerPage.waitForTimeout(2000);
  const reenabledShopCount = await customerPage.locator('text="Aataa Rings"').count();
  console.log('Count of Aataa Rings visible on /shop after re-enabling:', reenabledShopCount);
  if (reenabledShopCount === 0) {
    throw new Error('FAIL: Aataa Rings did not reappear after re-enabling!');
  }

  console.log('8. Verifying direct URL loads cleanly after re-enabling...');
  await customerPage.goto('http://127.0.0.1:5173/product/aataa-rings');
  await customerPage.waitForTimeout(2000);
  const restoredAddToBag = await customerPage.locator('button:has-text("Add to Bag")').count();
  console.log('Add to Bag button count on restored product page:', restoredAddToBag);
  if (restoredAddToBag === 0) {
    throw new Error('FAIL: Product page did not show Add to Bag button after re-enabling!');
  }

  await browser.close();
  console.log('\n======================================================');
  console.log('✅ ALL HIDDEN PRODUCT VERIFICATION CHECKS PASSED!');
  console.log('======================================================');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
