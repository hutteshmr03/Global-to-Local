import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/login');
  await page.click('button:has-text("Email")');
  await page.fill('input[type="email"]', 'admin@globaltolocal.in');
  await page.fill('input[type="password"]', 'GoaHeritageAdmin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
  await page.goto('http://localhost:5173/admin/orders');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'content-audit/admin-orders-clean.png' });
  console.log('Admin orders screenshot saved successfully.');
  await browser.close();
}

main().catch(console.error);
