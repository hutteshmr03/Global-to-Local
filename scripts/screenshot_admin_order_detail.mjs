import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173/login');
  await page.click('button:has-text("Email")');
  await page.fill('input[type="email"]', 'admin@globaltolocal.in');
  await page.fill('input[type="password"]', 'GoaHeritageAdmin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
  
  await page.goto('http://localhost:5173/admin/orders/83bc7721-7edf-4e78-a134-bbd643c77ec3');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'content-audit/admin-order-detail-action-button.png' });
  console.log('Saved admin order detail screenshot');

  const actionBtn = page.locator('button:has-text("Mark as")').first();
  const count = await actionBtn.count();
  console.log('Found action buttons:', count);

  if (count > 0) {
    await actionBtn.click();
    console.log('Clicked action button');
    await page.waitForTimeout(1000);
    const modalHeading = await page.locator('text=Are you sure').count();
    console.log('Are you sure count:', modalHeading);
    await page.screenshot({ path: 'content-audit/admin-order-detail-modal.png' });
    console.log('Saved admin order detail modal screenshot');
  }

  await browser.close();
}

main().catch(console.error);
