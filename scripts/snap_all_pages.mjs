import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  // Login via API
  await context.request.post('http://localhost:5173/api/v1/auth/login', {
    data: {
      email: 'admin@globaltolocal.in',
      password: process.env.ADMIN_PASSWORD || '',
    },
  });

  const page = await context.newPage();
  const pages = [
    { name: 'dashboard', url: 'http://localhost:5173/admin' },
    { name: 'products', url: 'http://localhost:5173/admin/products' },
    { name: 'orders', url: 'http://localhost:5173/admin/orders' },
    { name: 'customers', url: 'http://localhost:5173/admin/customers' },
    { name: 'enquiries', url: 'http://localhost:5173/admin/enquiries' },
  ];

  for (const p of pages) {
    await page.goto(p.url);
    await page.waitForTimeout(1500);
    const outPath = `content-audit/admin-after/${p.name}-1440px.png`;
    await page.screenshot({ path: outPath });
    console.log(`Saved ${outPath}`);
  }

  await browser.close();
}

run().catch(console.error);
