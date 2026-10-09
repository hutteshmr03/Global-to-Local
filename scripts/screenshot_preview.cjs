const { chromium } = require('playwright');
const { spawn } = require('child_process');

async function testPreview() {
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], { shell: true });
  
  await new Promise(r => setTimeout(r, 2000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'content-audit/rebuilt_hero_preview.png' });
  console.log('Saved content-audit/rebuilt_hero_preview.png');

  await browser.close();
  preview.kill();
  process.exit(0);
}

testPreview().catch(e => {
  console.error(e);
  process.exit(1);
});
