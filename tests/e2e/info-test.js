import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#links-container');
  await page.waitForTimeout(2000);
  
  console.log('Page loaded');
  
  const infoButtons = page.locator('button.info-button');
  const count = await infoButtons.count();
  console.log(`Found ${count} info buttons`);
  
  // Test 1: Open first info
  console.log('\nTest 1: Click first info');
  await infoButtons.nth(0).click();
  await page.waitForTimeout(1000);
  
  let openLi = await page.locator('li.info-open').count();
  let flyout = await page.locator('#global-info-flyout.show').count();
  let overlay = await page.locator('#info-overlay.show').count();
  console.log(`li.info-open: ${openLi}, flyout.show: ${flyout}, overlay.show: ${overlay}`);
  console.log(`Test 1 PASSED: ${openLi === 1 && flyout === 1 ? 'YES' : 'NO'}`);
  
  // Test 2: Press Escape to close
  console.log('\nTest 2: Press Escape to close');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  
  openLi = await page.locator('li.info-open').count();
  flyout = await page.locator('#global-info-flyout.show').count();
  overlay = await page.locator('#info-overlay.show').count();
  console.log(`li.info-open: ${openLi}, flyout.show: ${flyout}, overlay.show: ${overlay}`);
  console.log(`Test 2 PASSED: ${openLi === 0 && flyout === 0 ? 'YES' : 'NO'}`);
  
  // Test 3: Open second info
  console.log('\nTest 3: Click second info');
  await infoButtons.nth(1).click();
  await page.waitForTimeout(1000);
  
  openLi = await page.locator('li.info-open').count();
  flyout = await page.locator('#global-info-flyout.show').count();
  console.log(`li.info-open: ${openLi}, flyout.show: ${flyout}`);
  console.log(`Test 3 PASSED: ${openLi === 1 && flyout === 1 ? 'YES' : 'NO'}`);
  
  // Test 4: Click overlay to close
  console.log('\nTest 4: Click overlay to close');
  await page.locator('#info-overlay').click({ position: { x: 10, y: 10 }, force: true });
  await page.waitForTimeout(500);
  
  openLi = await page.locator('li.info-open').count();
  flyout = await page.locator('#global-info-flyout.show').count();
  console.log(`li.info-open: ${openLi}, flyout.show: ${flyout}`);
  console.log(`Test 4 PASSED: ${openLi === 0 && flyout === 0 ? 'YES' : 'NO'}`);
  
  console.log('\n========== DONE ==========');
  await page.waitForTimeout(2000);
  await browser.close();
})();
