// Capture mobile screenshots of the local site using Playwright
// Usage: node scripts/screenshot.js [url]
const fs = require('fs');
const path = require('path');

async function main() {
  const url = process.argv[2] || process.env.PREVIEW_URL || 'http://localhost:5173';
  const outDir = path.resolve(__dirname, '..', 'docs');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch {}

  const { chromium, devices } = require('playwright');

  const targets = [
    { name: 'iphone12', device: devices['iPhone 12'], file: 'preview-mobile-iphone12.png' },
    { name: 'android360x800', device: { viewport: { width: 360, height: 800 }, userAgent: devices['Pixel 5'].userAgent, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, file: 'preview-mobile-360x800.png' },
  ];

  for (const t of targets) {
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      locale: 'tr-TR',
      ...t.device,
    });
    const page = await context.newPage();
    // Faster, stable load
    await page.route('**/*', route => {
      const req = route.request();
      // allow all; could stub heavy analytics if any in future
      route.continue();
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // Small delay for fonts/backdrop filters to settle
    await page.waitForTimeout(800);
    const outPath = path.join(outDir, t.file);
    await page.screenshot({ path: outPath, fullPage: true });
    await context.close();
    console.log(`Saved: ${outPath}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

