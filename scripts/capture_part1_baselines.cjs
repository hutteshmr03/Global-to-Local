const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
};

function startSpaServer(distDir, port = 4179) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

const viewports = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];

const routes = [
  { path: '/', name: 'home' },
  { path: '/shop', name: 'shop' },
  { path: '/product-category/chutneys-and-spreads', name: 'category_chutneys' },
  { path: '/product/pineapple-jam-250-grams', name: 'product_pineapple_jam' },
  { path: '/our-story', name: 'our_story' },
  { path: '/our-social-corner', name: 'our_social_corner' },
  { path: '/in-the-news', name: 'in_the_news' },
  { path: '/contact', name: 'contact' },
  { path: '/shipping-policy', name: 'shipping_policy' },
  { path: '/return-and-exchange-policy', name: 'return_policy' },
  { path: '/terms-and-conditions', name: 'terms' },
  { path: '/privacy-policy', name: 'privacy' },
  { path: '/bag', name: 'bag' },
  { path: '/login', name: 'login' },
];

async function main() {
  const outDir = path.join(__dirname, '..', 'content-audit', 'baselines-part1');
  fs.mkdirSync(outDir, { recursive: true });
  const distDir = path.join(__dirname, '..', 'dist');

  const server = await startSpaServer(distDir, 4179);
  const browser = await chromium.launch({ headless: true });

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();

    for (const r of routes) {
      const url = `http://127.0.0.1:4179${r.path}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(600);
      const outPath = path.join(outDir, `${r.name}_${vp.name}px.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`Captured ${r.name} @ ${vp.name}px`);
    }
    await context.close();
  }

  await browser.close();
  server.close();
  console.log('All Part 1 baseline screenshots captured.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
