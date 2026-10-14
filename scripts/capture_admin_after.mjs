import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '360', width: 360, height: 800 },
];

const PAGES = [
  { name: 'dashboard', path: '/admin' },
  { name: 'products', path: '/admin/products' },
  { name: 'orders', path: '/admin/orders' },
  { name: 'order-detail', path: '/admin/orders/53a0fbec-6783-417f-bbee-b01624f7b106' },
  { name: 'customers', path: '/admin/customers' },
  { name: 'enquiries', path: '/admin/enquiries' },
];

async function main() {
  const outDir = path.resolve('content-audit/admin-after');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    // Login once per viewport session
    await page.goto('http://localhost:5173/login');
    await page.click('button:has-text("Email")');
    await page.fill('input[type="email"]', 'admin@globaltolocal.in');
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 10000 });

    for (const p of PAGES) {
      await page.goto(`http://localhost:5173${p.path}`);
      await page.waitForTimeout(1000);
      const filename = path.join(outDir, `${p.name}-${vp.name}px.png`);
      await page.screenshot({ path: filename, fullPage: false });
      console.log(`Captured after: ${p.name} at ${vp.name}px -> ${filename}`);
    }

    // On 360px and 768px, test and capture the mobile drawer
    if (vp.width <= 1024) {
      await page.goto('http://localhost:5173/admin');
      await page.waitForTimeout(600);
      const menuBtn = page.locator('button[aria-label="Toggle admin menu"]');
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
        await page.waitForTimeout(500);
        const drawerFile = path.join(outDir, `mobile-drawer-${vp.name}px.png`);
        await page.screenshot({ path: drawerFile, fullPage: false });
        console.log(`Captured mobile drawer at ${vp.name}px -> ${drawerFile}`);
      }
    }

    await page.close();
  }

  // Also capture the Confirmation Dialog (Yes/No) and Product Modal
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173/login');
    await page.click('button:has-text("Email")');
    await page.fill('input[type="email"]', 'admin@globaltolocal.in');
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 10000 });

    // Confirmation dialog
    await page.goto('http://localhost:5173/admin/orders/53a0fbec-6783-417f-bbee-b01624f7b106');
    await page.waitForTimeout(1000);
    const actionBtn = page.locator('button:has-text("Mark as")').first();
    if (await actionBtn.isVisible()) {
      await actionBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, 'order-detail-yes-no-modal.png') });
      console.log('Captured order detail Yes/No modal');
    }

    // Product edit modal
    await page.goto('http://localhost:5173/admin/products');
    await page.waitForTimeout(1000);
    const editBtn = page.locator('button:has-text("Edit Price & Stock")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, 'products-edit-modal.png') });
      console.log('Captured products edit modal');
    }

    await page.close();
  }

  await browser.close();
  console.log('All verification screenshots captured successfully!');
}

main().catch(console.error);
