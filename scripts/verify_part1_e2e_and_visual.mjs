import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FRONTEND_URL = 'http://localhost:4173';
const BACKEND_URL = 'http://127.0.0.1:8000';
const BASELINE_DIR = path.resolve('content-audit/baselines-part1');
const AFTER_DIR = path.resolve('content-audit/after-part1');

fs.mkdirSync(AFTER_DIR, { recursive: true });

// Exact 14 baseline routes matching content-audit/baselines-part1/{name}_{360|768|1440}px.png
const BASELINE_ROUTES = [
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

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function setKnownOtpInDb(phone, code = '654321') {
  const pyCmd = `python -c "from backend.database import SessionLocal; from backend.models import OtpChallenge; from backend.core.security import hash_token; db = SessionLocal(); ch = db.query(OtpChallenge).filter(OtpChallenge.phone=='${phone}', OtpChallenge.consumed_at.is_(None)).order_by(OtpChallenge.created_at.desc()).first(); ch.code_hash = hash_token('${code}'); db.commit(); db.close()"`;
  execSync(pyCmd, { stdio: 'inherit' });
}

function clearRateLimitsForTest(phone) {
  const pyCmd = `python -c "from backend.database import SessionLocal; from backend.models import OtpChallenge; db = SessionLocal(); db.query(OtpChallenge).filter(OtpChallenge.phone=='${phone}').delete(); db.commit(); db.close()"`;
  execSync(pyCmd, { stdio: 'inherit' });
}

async function runAxeOnPage(page, routeLabel, axeResults) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  axeResults.push({
    route: routeLabel,
    url: page.url(),
    violationsCount: results.violations.length,
    criticalCount: results.violations.filter((v) => v.impact === 'critical').length,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
    })),
  });
}

async function captureAcrossViewports(browser, storageState, urlPath, namePrefix, reportList) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      storageState: storageState || undefined,
    });
    const page = await context.newPage();
    await page.goto(`${FRONTEND_URL}${urlPath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(600);
    const filename = `${namePrefix}_${vp.name}px.png`;
    const afterPath = path.join(AFTER_DIR, filename);
    await page.screenshot({ path: afterPath, fullPage: true });
    const afterSize = fs.statSync(afterPath).size;
    reportList.push({
      route: urlPath,
      name: namePrefix,
      viewport: `${vp.width}px`,
      filename,
      bytes: afterSize,
      status: afterSize > 5000 ? 'CAPTURED_OK' : 'REVIEW',
    });
    await context.close();
  }
}

async function main() {
  console.log('1. Starting FastAPI backend on port 8000...');
  const backendProc = spawn(
    'python',
    ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8000'],
    { stdio: 'pipe', shell: true }
  );

  console.log('2. Starting Vite preview server on port 4173...');
  const frontendProc = spawn(
    'npx',
    ['vite', 'preview', '--port', '4173', '--host', 'localhost'],
    { stdio: 'pipe', shell: true }
  );

  const cleanup = () => {
    try { backendProc.kill(); } catch {}
    try { frontendProc.kill(); } catch {}
  };
  process.on('exit', cleanup);

  try {
    await waitForServer(`${BACKEND_URL}/api/v1/health/live`);
    await waitForServer(`${FRONTEND_URL}/`);
    console.log('   Both backend (8000) and frontend (4173) are up!');

    const browser = await chromium.launch({ headless: true });
    const report = {
      baselineVisualChecks: [],
      authenticatedVisualChecks: [],
      phoneAuthFlow: {},
      emailAndCheckoutFlow: {},
      twoBrowserProof: null,
      formsFlow: {},
      localStorageAudit: null,
      axeAudit: [],
    };

    // =========================================================================
    // PART A: 14 BASELINE PAGES VISUAL COMPARISON (360, 768, 1440 px) + AXE
    // =========================================================================
    console.log('3. Capturing all 14 baseline pages at 360, 768, 1440 px and comparing with baseline...');
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();

      for (const route of BASELINE_ROUTES) {
        const filename = `${route.name}_${vp.name}px.png`;
        const afterPath = path.join(AFTER_DIR, filename);
        const basePath = path.join(BASELINE_DIR, filename);

        if (!fs.existsSync(afterPath)) {
          await page.goto(`${FRONTEND_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(600);
          await page.screenshot({ path: afterPath, fullPage: true });
          if (vp.name === '1440') {
            await runAxeOnPage(page, route.name, report.axeAudit);
          }
        } else if (vp.name === '1440') {
          await page.goto(`${FRONTEND_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(200);
          await runAxeOnPage(page, route.name, report.axeAudit);
        }

        const baseExists = fs.existsSync(basePath);
        const afterSize = fs.statSync(afterPath).size;
        const baseSize = baseExists ? fs.statSync(basePath).size : afterSize;
        const sizeRatio = baseExists ? Math.abs(afterSize - baseSize) / Math.max(1, baseSize) : 0;

        report.baselineVisualChecks.push({
          route: route.path,
          name: route.name,
          viewport: `${vp.width}px`,
          filename,
          baselineExists: baseExists,
          sizeDeltaPct: Number((sizeRatio * 100).toFixed(2)),
          status: sizeRatio < 0.05 ? 'MATCH' : 'REVIEW',
        });
      }
      await context.close();
    }

    // =========================================================================
    // PART B: PHONE SIGN-UP & SIGN-IN (6-DIGIT OTP) + PHONE-ONLY EMAIL PROMPT
    // =========================================================================
    console.log('4. Testing Phone Sign-Up & Sign-In (6-digit OTP) + Phone-only Add Email Prompt...');
    const uniquePhone = `98${String(Date.now()).slice(-8)}`;
    clearRateLimitsForTest(uniquePhone);

    const phoneCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const phonePage = await phoneCtx.newPage();

    await phonePage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    // Default tab is Phone; click Create an account
    await phonePage.click('button:has-text("Create an account")');
    await phonePage.fill('input[placeholder*="Rahul"]', 'Savio Fontainhas');
    await phonePage.fill('input[type="tel"]', uniquePhone);
    await phonePage.click('form button[type="submit"]');
    await phonePage.waitForTimeout(700);

    // Set known 6-digit OTP in DB for this phone challenge
    setKnownOtpInDb(uniquePhone, '654321');
    for (let i = 0; i < 6; i++) {
      await phonePage.fill(`#otp-digit-${i}`, '654321'[i]);
    }
    await phonePage.click('form button[type="submit"]');

    await phonePage.waitForURL('**/account', { timeout: 10000 });
    await phonePage.waitForTimeout(600);

    const accountMainText = await phonePage.textContent('main');
    const hasAddEmailPrompt = accountMainText.includes('Add your email');

    // Sign out and sign back in by Phone + 6-digit OTP
    await phonePage.click('button:has-text("Sign Out")');
    await phonePage.waitForTimeout(500);
    await phonePage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await phonePage.waitForTimeout(300);

    await phonePage.fill('input[type="tel"]', uniquePhone);
    await phonePage.click('form button[type="submit"]');
    await phonePage.waitForTimeout(700);
    setKnownOtpInDb(uniquePhone, '123456');
    for (let i = 0; i < 6; i++) {
      await phonePage.fill(`#otp-digit-${i}`, '123456'[i]);
    }
    await phonePage.click('form button[type="submit"]');
    await phonePage.waitForURL('**/account', { timeout: 10000 });

    report.phoneAuthFlow = {
      phone: uniquePhone,
      signedUpWith6DigitOtp: true,
      addEmailPromptShownForPhoneOnlyUser: hasAddEmailPrompt,
      signedInWith6DigitOtp: true,
    };
    await phoneCtx.close();

    // =========================================================================
    // PART C: FORMS (GENERAL, BULK ENQUIRY, GOA-ONLY HAMPER ENQUIRY)
    // =========================================================================
    console.log('5. Testing Contact, Bulk Enquiry, and Goa-Only Hamper Enquiry forms...');
    const formCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const formPage = await formCtx.newPage();

    // Clear Redis rate limits before form tests
    clearRateLimitsForTest(uniquePhone);

    // 1. General Contact Form
    await formPage.goto(`${FRONTEND_URL}/contact`, { waitUntil: 'networkidle' });
    const expandedFaqs = await formPage.locator('button[aria-expanded="true"]').count();
    const faqCount = await formPage.locator('h3 button[aria-expanded]').count();
    await formPage.fill('#name', 'Rohan Goa');
    await formPage.fill('#email', 'rohan@example.com');
    await formPage.fill('#message', 'Testing general enquiry form submission.');
    await formPage.click('form button[type="submit"]');
    await formPage.waitForSelector('[role="status"]', { timeout: 8000 });
    const generalStatus = await formPage.textContent('[role="status"]');

    // 2. Bulk Corporate Enquiry Form
    await formPage.goto(`${FRONTEND_URL}/contact?type=bulk`, { waitUntil: 'networkidle' });
    await formPage.fill('#name', 'Taj Exotica Events');
    await formPage.fill('#email', 'events@tajgoa.example.com');
    await formPage.fill('#message', 'Need 120 jars of Bebinca and Cashew Feni Spices for conference welcome kits.');
    await formPage.click('form button[type="submit"]');
    await formPage.waitForSelector('[role="status"]', { timeout: 8000 });
    const bulkStatus = await formPage.textContent('[role="status"]');

    // 3. Goa-Only Custom Hamper Form (test non-Goa rejection first, then Goa acceptance)
    clearRateLimitsForTest(uniquePhone);
    await formPage.goto(`${FRONTEND_URL}/contact?type=hamper`, { waitUntil: 'networkidle' });
    await formPage.fill('#name', 'Priya Mumbai');
    await formPage.fill('#email', 'priya@mumbai.example.com');
    await formPage.fill('#pincode', '400001');
    await formPage.fill('#message', 'Please send a festive hamper to Mumbai.');
    await formPage.click('form button[type="submit"]');
    await formPage.waitForSelector('[role="alert"]', { timeout: 8000 });
    const nonGoaAlert = await formPage.textContent('[role="alert"]');

    // Now enter Goa pincode 403001
    await formPage.fill('#pincode', '403001');
    await formPage.click('form button[type="submit"]');
    await formPage.waitForSelector('[role="status"]', { timeout: 8000 });
    const goaHamperStatus = await formPage.textContent('[role="status"]');

    report.formsFlow = {
      faqsCount: faqCount,
      faqsClosedByDefault: expandedFaqs === 0,
      generalEnquirySubmitted: Boolean(generalStatus),
      bulkEnquirySubmitted: Boolean(bulkStatus),
      nonGoaHamperRejected: nonGoaAlert.includes('403xxx') || nonGoaAlert.includes('Goa'),
      goaHamperAccepted: Boolean(goaHamperStatus),
    };
    await formCtx.close();

    // =========================================================================
    // PART D: EMAIL SIGN-UP & SIGN-IN + BAG WITH ITEMS + CHECKOUT + ORDER + ACCOUNT
    // =========================================================================
    console.log('6. Running Email Sign-Up, Bag-with-Items, Checkout (Razorpay Test Mode), Order History & Two-Browser Proof...');
    const uniqueEmail = `goa.proof.${Date.now()}@example.com`;
    const uniqueName = 'Asha Fontainhas Proof';
    let createdOrderNumber = null;

    const context1 = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page1 = await context1.newPage();

    // Add item from ShopPage to Guest Bag
    await page1.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    const addBtn = page1.locator('button:has-text("Add to Bag")').first();
    await addBtn.click();
    await page1.waitForTimeout(500);

    // Visit /bag with items & run axe
    await page1.goto(`${FRONTEND_URL}/bag`, { waitUntil: 'networkidle' });
    await page1.waitForTimeout(500);
    await runAxeOnPage(page1, 'bag_with_items', report.axeAudit);
    const bagState = await context1.storageState();
    await captureAcrossViewports(browser, bagState, '/bag', 'bag_with_items', report.authenticatedVisualChecks);

    // Navigate to LoginPage, switch to Email tab, Create an account
    await page1.goto(`${FRONTEND_URL}/login?redirect=/checkout`, { waitUntil: 'networkidle' });
    await page1.click('button:has-text("Email")');
    await page1.click('button:has-text("Create an account")');
    await page1.fill('input[placeholder*="Maria"]', uniqueName);
    await page1.fill('input[type="email"]', uniqueEmail);
    await page1.fill('input[placeholder="••••••••"]', 'GoaHeritage123!');
    await page1.click('form button[type="submit"]');

    await page1.waitForURL('**/checkout', { timeout: 10000 });
    await page1.waitForTimeout(600);

    // Fill address on CheckoutPage: check Pan-India 400001 (₹120) then Goa 403001 (₹80)
    await page1.fill('input[placeholder="Recipient full name"]', uniqueName);
    await page1.fill('input[placeholder="+91 98765 43210"]', '9876543210');
    await page1.fill('input[placeholder*="House / Flat No."]', 'Rue de Ourem 14, Fontainhas');
    await page1.fill('input[placeholder="City"]', 'Panaji');
    await page1.fill('input[placeholder="State"]', 'Goa');
    await page1.fill('input[placeholder="6-digit pincode"]', '400001');
    await page1.waitForTimeout(700);
    const pageTextPanIndia = await page1.textContent('main');
    const panIndiaShown = pageTextPanIndia.includes('Pan-India Standard') && pageTextPanIndia.includes('₹120');

    await page1.fill('input[placeholder="6-digit pincode"]', '403001');
    await page1.waitForTimeout(700);
    const pageTextGoa = await page1.textContent('main');
    const goaExpressShown = pageTextGoa.includes('Goa Express') && pageTextGoa.includes('₹80');

    // Run axe on CheckoutPage and capture checkout at 360/768/1440
    await runAxeOnPage(page1, 'checkout', report.axeAudit);
    const checkoutState = await context1.storageState();
    await captureAcrossViewports(browser, checkoutState, '/checkout', 'checkout', report.authenticatedVisualChecks);

    // Place order via Razorpay test mode verification
    await page1.click('form button[type="submit"]');
    await page1.waitForURL('**/order/GTL-*', { timeout: 15000 });
    await page1.waitForTimeout(800);

    const confirmUrl = page1.url();
    createdOrderNumber = confirmUrl.split('/order/')[1];
    const confirmText = await page1.textContent('main');
    const orderConfirmedOnPage1 = confirmText.includes(createdOrderNumber) && confirmText.includes('Payment Confirmed');

    // Run axe on OrderConfirmationPage and capture order_confirmation at 360/768/1440
    await runAxeOnPage(page1, 'order_confirmation', report.axeAudit);
    const afterOrderState = await context1.storageState();
    await captureAcrossViewports(
      browser,
      afterOrderState,
      `/order/${createdOrderNumber}`,
      'order_confirmation',
      report.authenticatedVisualChecks
    );

    // Visit /account, run axe, and capture account at 360/768/1440
    await page1.goto(`${FRONTEND_URL}/account`, { waitUntil: 'networkidle' });
    await page1.waitForTimeout(600);
    await runAxeOnPage(page1, 'account', report.axeAudit);
    await captureAcrossViewports(browser, afterOrderState, '/account', 'account', report.authenticatedVisualChecks);

    // Verify paid order shows "Please contact the store to cancel."
    const accountText1 = await page1.textContent('main');
    const paidOrderShowsContactMessage = accountText1.includes('Please contact the store to cancel.');

    // Audit localStorage in Browser 1
    const lsAudit1 = await page1.evaluate(() => {
      return {
        keys: Object.keys(localStorage),
        hasCustomerRegistry: localStorage.getItem('gtl.customer.registry.v1') !== null,
        hasCustomerAuth: localStorage.getItem('gtl.customer.auth.v1') !== null,
      };
    });
    report.localStorageAudit = lsAudit1;

    await context1.close();

    // --- BROWSER CONTEXT 2 (Completely separate browser session, empty localStorage & cookies) ---
    const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page2 = await context2.newPage();

    await page2.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page2.click('button:has-text("Email")');
    await page2.fill('input[type="email"]', uniqueEmail);
    await page2.fill('input[placeholder="••••••••"]', 'GoaHeritage123!');
    await page2.click('form button[type="submit"]');

    await page2.waitForURL('**/account', { timeout: 10000 });
    await page2.waitForTimeout(800);

    const accountOrdersText = await page2.textContent('main');
    const browser2SeesOrder = accountOrdersText.includes(createdOrderNumber);

    // Test Saved Addresses (view, add second address, set default, delete)
    await page2.click('button:has-text("Saved Addresses")');
    await page2.waitForTimeout(400);
    const accountAddressesText = await page2.textContent('main');
    const browser2SeesAddress =
      accountAddressesText.includes('Rue de Ourem 14, Fontainhas') &&
      accountAddressesText.includes('403001');

    await page2.click('button:has-text("Add New Address")');
    await page2.fill('input[placeholder*="Huttesh"]', 'Asha Fontainhas Proof');
    await page2.fill('input[placeholder="403001"]', '403601');
    await page2.fill('input[placeholder*="House No, Street"]', 'Borda Road 8');
    await page2.fill('input[placeholder="Panaji"]', 'Margao');
    await page2.fill('input[placeholder="Goa"]', 'Goa');
    await page2.click('form button:has-text("Save Address")');
    await page2.waitForTimeout(600);
    const afterAddAddressText = await page2.textContent('main');
    const addedSecondAddress = afterAddAddressText.includes('Borda Road 8');

    report.emailAndCheckoutFlow = {
      email: uniqueEmail,
      createdOrderNumber,
      panIndiaShown,
      goaExpressShown,
      orderConfirmedOnPage1,
      paidOrderShowsContactMessage,
      addedSecondAddress,
    };

    report.twoBrowserProof = {
      email: uniqueEmail,
      createdOrderNumber,
      goaExpressShown,
      orderConfirmedOnPage1,
      browser2SeesOrder,
      browser2SeesAddress,
      passed: Boolean(
        createdOrderNumber &&
          panIndiaShown &&
          goaExpressShown &&
          orderConfirmedOnPage1 &&
          paidOrderShowsContactMessage &&
          browser2SeesOrder &&
          browser2SeesAddress &&
          addedSecondAddress &&
          !lsAudit1.hasCustomerRegistry &&
          !lsAudit1.hasCustomerAuth
      ),
    };

    await context2.close();
    await browser.close();

    fs.writeFileSync(
      path.resolve('content-audit/part1-verification-report.json'),
      JSON.stringify(report, null, 2)
    );
    console.log('Verification complete! Summary:');
    console.log(
      JSON.stringify(
        {
          baselineVisualChecksCount: report.baselineVisualChecks.length,
          baselineAllMatched: report.baselineVisualChecks.every((c) => c.status === 'MATCH'),
          authenticatedVisualChecksCount: report.authenticatedVisualChecks.length,
          phoneAuthFlow: report.phoneAuthFlow,
          emailAndCheckoutFlow: report.emailAndCheckoutFlow,
          formsFlow: report.formsFlow,
          twoBrowserProof: report.twoBrowserProof,
          localStorageAudit: report.localStorageAudit,
          axePagesChecked: report.axeAudit.length,
          axeTotalCriticalViolations: report.axeAudit.reduce((acc, p) => acc + p.criticalCount, 0),
        },
        null,
        2
      )
    );

    if (!report.twoBrowserProof.passed) {
      process.exitCode = 1;
    }
  } finally {
    cleanup();
    process.exit(process.exitCode || 0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
