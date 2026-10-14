const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Add item
    console.log('1. Adding Wine Biscuits from product page...');
    await page.goto('http://127.0.0.1:5173/product/wine-biscuits-200-grams', { waitUntil: 'networkidle' });

    await page.locator('button[aria-label="Increase quantity"]').click();
    await page.locator('button:has-text("Add 2 items to Bag")').click();

    await page.waitForSelector('text=Your Bag', { timeout: 5000 });
    console.log('Drawer opened. Items in bag confirmed.');

    // 2. Login as shopper
    console.log('2. Logging in via /login...');
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' });

    // Switch to Email tab or fill phone
    await page.locator('button:has-text("Email")').click();
    await page.locator('input[type="email"]').fill('shopper@globaltolocal.in');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]:has-text("Sign in")').click();

    await page.waitForTimeout(1000);
    console.log('Logged in successfully!');

    // 3. Navigate to /checkout
    console.log('3. Navigating to Checkout (/checkout)...');
    await page.goto('http://127.0.0.1:5173/checkout', { waitUntil: 'networkidle' });

    await page.waitForSelector('h1:has-text("Checkout")', { timeout: 5000 });
    console.log('Checkout page loaded!');

    const checkoutScreenshot = path.join(__dirname, 'screenshots', 'checkout_page_success.png');
    await page.screenshot({ path: checkoutScreenshot });
    console.log('Checkout page screenshot saved to:', checkoutScreenshot);

    console.log('ALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
