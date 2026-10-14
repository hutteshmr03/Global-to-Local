const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to Wine Biscuits product page...');
    await page.goto('http://127.0.0.1:5173/product/wine-biscuits-200-grams', { waitUntil: 'networkidle' });

    console.log('Page loaded. Checking title...');
    const heading = await page.locator('h1').textContent();
    console.log('Heading:', heading);

    // Increase quantity to 8
    console.log('Clicking plus button 7 times to reach qty 8...');
    const plusBtn = page.locator('button[aria-label="Increase quantity"]');
    for (let i = 0; i < 7; i++) {
      await plusBtn.click();
      await page.waitForTimeout(100);
    }

    // Check add to bag button text
    const addBtn = page.locator('button:has-text("Add 8 items to Bag")');
    console.log('Add button found:', await addBtn.textContent());

    // Click Add to Bag
    console.log('Clicking Add to Bag...');
    await addBtn.click();

    // Wait for drawer to appear
    await page.waitForSelector('text=Your Bag', { timeout: 5000 });
    console.log('Bag drawer is visible!');

    // Wait a brief moment for any animation or state to settle
    await page.waitForTimeout(1000);

    // Check for error banner
    const errorBanner = await page.locator('text=Request failed').count();
    console.log('Error banner count (should be 0):', errorBanner);

    // Check bag header text
    const bagHeader = await page.locator('h2:has-text("Your Bag")').textContent();
    console.log('Bag header text:', bagHeader);

    // Check item title inside drawer
    const itemInBag = await page.locator('div[role="dialog"] a:has-text("Wine Biscuits")').count();
    console.log('Wine Biscuits in bag count:', itemInBag);

    // Take a screenshot of the open bag drawer
    const screenshotPath = path.join(__dirname, 'screenshots', 'cart_success.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot saved to:', screenshotPath);

    if (errorBanner > 0) {
      console.error('FAIL: Error banner present!');
      process.exit(1);
    }

    if (itemInBag === 0) {
      console.error('FAIL: Item not found in bag!');
      process.exit(1);
    }

    console.log('SUCCESS: Product successfully added to bag without any errors!');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
