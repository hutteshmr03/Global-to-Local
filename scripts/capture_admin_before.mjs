import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '360', width: 360, height: 800 },
];

const PAGES = [
  { name: 'dashboard', url: 'http://localhost:5173/admin' },
  { name: 'products', url: 'http://localhost:5173/admin/products' },
  { name: 'orders', url: 'http://localhost:5173/admin/orders' },
  { name: 'order-detail', url: 'http://localhost:5173/admin/orders/83bc7721-7edf-4e78-a134-bbd643c77ec3' },
  { name: 'customers', url: 'http://localhost:5173/admin/customers' },
  { name: 'enquiries', url: 'http://localhost:5173/admin/enquiries' },
];

async function main() {
  const outDir = path.resolve('content-audit/admin-before');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    
    // Login
    await page.goto('http://localhost:5173/login');
    await page.click('button:has-text("Email")');
    await page.fill('input[type="email"]', 'admin@globaltolocal.in');
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 10000 });

    for (const p of PAGES) {
      await page.goto(p.url);
      await page.waitForTimeout(800);
      const filename = path.join(outDir, `${p.name}-${vp.name}px.png`);
      await page.screenshot({ path: filename, fullPage: false });
      console.log(`Captured before: ${p.name} at ${vp.name}px`);
    }

    await page.close();
  }

  await browser.close();
  console.log('All before screenshots captured successfully.');
}

main().catch(console.error);
