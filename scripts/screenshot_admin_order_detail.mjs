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
  
  const firstViewBtn = page.locator('a:has-text("View & Process")').first();
  await firstViewBtn.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'content-audit/admin-order-detail-action-button.png' });
  console.log('Saved admin order detail screenshot');

  // Also click the action button to see the modal
  const actionBtn = page.locator('button:has-text("Mark as")').first();
  if (await actionBtn.count() > 0) {
    await actionBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'content-audit/admin-order-detail-modal.png' });
    console.log('Saved admin order detail modal screenshot');
  }

  await browser.close();
}

main().catch(console.error);
