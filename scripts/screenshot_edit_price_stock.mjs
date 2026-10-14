import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/login');
  await page.click('button:has-text("Email")');
  await page.fill('input[type="email"]', 'admin@globaltolocal.in');
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || '');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
  await page.goto('http://localhost:5173/admin/products');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'content-audit/admin-products-button.png' });

  // Click "Edit Price & Stock" on first item
  await page.click('button:has-text("Edit Price & Stock")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'content-audit/admin-products-modal.png' });

  console.log('Screenshots captured successfully.');
  await browser.close();
}

main().catch(console.error);
