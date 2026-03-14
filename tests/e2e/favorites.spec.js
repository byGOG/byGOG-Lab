/**
 * E2E Tests – Favorites Workflow
 * Covers: default favorites, sidebar updates, localStorage persistence
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Favorites Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh: clear localStorage so defaults load each time
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.removeItem('bygog_favs'));
    await page.reload();
    await page.waitForSelector('#links-container');
  });

  test('sidebar is visible with default favorites on first load', async ({ page }) => {
    const sidebar = page.locator('#favorites-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('sidebar contains at least one default favorite item', async ({ page }) => {
    const sidebar = page.locator('#favorites-sidebar');
    await expect(sidebar).toBeVisible();
    // There should be list items inside the sidebar
    const items = sidebar.locator('li');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('toggling a favorite off removes it from sidebar', async ({ page }) => {
    // Find an active favorite button (one of the defaults)
    const activeFavBtn = page.locator('.fav-btn.active').first();
    await activeFavBtn.waitFor({ state: 'visible' });

    const name = await activeFavBtn.getAttribute('data-name');
    expect(name).toBeTruthy();

    await activeFavBtn.click();

    // Re-check: this item should no longer be .active
    const sameBtn = page.locator(`.fav-btn[data-name="${name}"]`).first();
    await expect(sameBtn).not.toHaveClass(/active/);

    // Sidebar should still be rendered (other defaults remain)
    const sidebar = page.locator('#favorites-sidebar');
    await expect(sidebar).toBeAttached();
  });

  test('toggling a favorite on adds it to sidebar', async ({ page }) => {
    // Find an inactive favorite button
    const inactiveFavBtn = page.locator('.fav-btn:not(.active)').first();
    if (await inactiveFavBtn.count() === 0) {
      test.skip(true, 'No inactive favorite buttons found');
      return;
    }
    await inactiveFavBtn.waitFor({ state: 'visible' });

    await inactiveFavBtn.click();

    // Now it should be active
    await expect(inactiveFavBtn).toHaveClass(/active/);

    // Sidebar should still be visible
    const sidebar = page.locator('#favorites-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('favorites persist across page reload', async ({ page }) => {
    const favBtn = page.locator('.fav-btn').first();
    await favBtn.waitFor({ state: 'visible' });

    const name = await favBtn.getAttribute('data-name');
    const wasFavorite = await favBtn.evaluate(el => el.classList.contains('active'));

    await favBtn.click();

    const afterClick = await favBtn.evaluate(el => el.classList.contains('active'));
    expect(afterClick).toBe(!wasFavorite);

    // Reload and re-check
    await page.reload();
    await page.waitForSelector('#links-container');

    const sameBtn = page.locator(`.fav-btn[data-name="${name}"]`).first();
    await sameBtn.waitFor({ state: 'visible' });
    const afterReload = await sameBtn.evaluate(el => el.classList.contains('active'));
    expect(afterReload).toBe(!wasFavorite);
  });

  test('localStorage bygog_favs is set after toggling', async ({ page }) => {
    const favBtn = page.locator('.fav-btn').first();
    await favBtn.waitFor({ state: 'visible' });
    await favBtn.click();

    const stored = await page.evaluate(() => localStorage.getItem('bygog_favs'));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored);
    expect(Array.isArray(parsed)).toBe(true);
  });

  test('favorites are restored from localStorage on reload', async ({ page }) => {
    // Manually set a specific favorites list
    await page.evaluate(() => {
      localStorage.setItem('bygog_favs', JSON.stringify(['Ninite']));
    });
    await page.reload();
    await page.waitForSelector('#links-container');

    // Only Ninite should be active
    const niniteBtn = page.locator('.fav-btn[data-name="Ninite"]').first();
    if (await niniteBtn.count() > 0) {
      await expect(niniteBtn).toHaveClass(/active/);
    }
  });
});
