import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  // Login directly via API to get session cookies in context
  const res = await context.request.post('http://localhost:5173/api/v1/auth/login', {
    data: {
      email: 'admin@globaltolocal.in',
      password: process.env.ADMIN_PASSWORD || '',
    },
  });
  console.log('Login status:', res.status());

  const page = await context.newPage();
  await page.goto('http://localhost:5173/admin/orders/53a0fbec-6783-417f-bbee-b01624f7b106');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'content-audit/order-detail-current.png' });
  console.log('Saved content-audit/order-detail-current.png');
  await browser.close();
}

run().catch(console.error);
