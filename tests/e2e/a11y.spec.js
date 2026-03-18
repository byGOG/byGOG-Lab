import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should pass axe accessibility checks on main page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.category-card');

    const results = await new AxeBuilder({ page })
      .exclude('.sc-embed') // SoundCloud iframe — third-party
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('should have skip link that focuses main content', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should have aria-labels on category nav buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.nav-item');

    const buttons = page.locator('.nav-item');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const label = await buttons.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });
});
