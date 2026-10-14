import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', resp => {
    if (resp.url().includes('/status')) {
      console.log('STATUS API RESPONSE:', resp.status(), resp.url());
    }
  });

  await page.goto('http://localhost:5173/login');
  await page.click('button:has-text("Email")');
  await page.fill('input[type="email"]', 'admin@globaltolocal.in');
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || '');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
  
  await page.goto('http://localhost:5173/admin/orders/83bc7721-7edf-4e78-a134-bbd643c77ec3');
  await page.waitForTimeout(1000);
  
  const actionBtn = page.locator('button:has-text("Mark as")').first();
  await actionBtn.click();
  await page.waitForTimeout(500);
  
  // Click 'Yes'
  const yesBtn = page.locator('button:has-text("Yes")');
  await yesBtn.click();
  await page.waitForTimeout(2000);

  const errorBox = page.locator('.bg-rose-50');
  if (await errorBox.count() > 0) {
    console.log('ERROR BOX TEXT:', await errorBox.innerText());
  }

  await browser.close();
}

main().catch(console.error);
