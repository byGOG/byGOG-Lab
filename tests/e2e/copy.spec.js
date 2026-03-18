/**
 * E2E Tests – Copy Button Workflow
 * Covers: button visibility, state transitions, clipboard content, Winutil command
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Copy Button Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('#links-container');
  });

  test('copy buttons are rendered for items with commands', async ({ page }) => {
    const copyBtns = page.locator('.copy-button');
    const count = await copyBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('copy button has required accessibility attributes', async ({ page }) => {
    const copyBtn = page.locator('.copy-button').first();
    if ((await copyBtn.count()) === 0) {
      test.skip(true, 'No copy buttons found');
      return;
    }
    await expect(copyBtn).toHaveAttribute('aria-label');
    await expect(copyBtn).toHaveAttribute('data-copy');
  });

  test('copy button shows loading then success state after click', async ({ page }) => {
    const copyBtn = page.locator('.copy-button').first();
    if ((await copyBtn.count()) === 0) {
      test.skip(true, 'No copy buttons found');
      return;
    }

    await copyBtn.click();

    // Should transition to copied
    await expect(copyBtn).toHaveClass(/copied/, { timeout: 1000 });
  });

  test('copy button resets to default state after 2 seconds', async ({ page }) => {
    const copyBtn = page.locator('.copy-button').first();
    if ((await copyBtn.count()) === 0) {
      test.skip(true, 'No copy buttons found');
      return;
    }

    await copyBtn.click();
    await expect(copyBtn).toHaveClass(/copied/, { timeout: 1000 });

    // After ~2.5s it should reset
    await page.waitForTimeout(2500);
    await expect(copyBtn).not.toHaveClass(/copied/);
    await expect(copyBtn).not.toHaveClass(/copy-error/);
    await expect(copyBtn).not.toHaveClass(/copy-loading/);
  });

  test('copy button is not double-clickable while in loading state', async ({ page }) => {
    const copyBtn = page.locator('.copy-button').first();
    if ((await copyBtn.count()) === 0) {
      test.skip(true, 'No copy buttons found');
      return;
    }

    await copyBtn.click();
    // Should be disabled during loading/copied phase
    const isDisabled = await copyBtn.evaluate(el => el.disabled);
    expect(isDisabled).toBe(true);
  });

  test('Winutil copy button data-copy contains christitus.com command', async ({ page }) => {
    // Find the Winutil item's copy button specifically
    const winutilCopyBtn = page
      .locator('li')
      .filter({ hasText: 'Winutil' })
      .locator('.copy-button')
      .first();
    if ((await winutilCopyBtn.count()) === 0) {
      test.skip(true, 'Winutil copy button not found');
      return;
    }

    const copyValue = await winutilCopyBtn.getAttribute('data-copy');
    expect(copyValue).toContain('christitus.com/win');
    expect(copyValue).toContain('irm');
    expect(copyValue).toContain('iex');
  });

  test('copy button sr-only text updates to success label after copy', async ({ page }) => {
    const copyBtn = page.locator('.copy-button').first();
    if ((await copyBtn.count()) === 0) {
      test.skip(true, 'No copy buttons found');
      return;
    }

    await copyBtn.click();
    await expect(copyBtn).toHaveClass(/copied/, { timeout: 1000 });

    const srText = await copyBtn.locator('.sr-only').textContent();
    expect(srText).toBeTruthy();
    // Should show success label (Kopyalandı in Turkish)
    expect(srText).toMatch(/kopyal/i);
  });
});
