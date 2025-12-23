/**
 * E2E Tests for byGOG Lab
 * Uses Playwright for browser automation
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('byGOG Lab E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for app to load
    await page.waitForSelector('#links-container');
  });

  test.describe('Search Functionality', () => {
    test('search input is visible and focusable', async ({ page }) => {
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toBeVisible();
      await searchInput.focus();
      await expect(searchInput).toBeFocused();
    });

    test('typing in search filters results', async ({ page }) => {
      const searchInput = page.locator('#search-input');
      await searchInput.fill('git');
      
      // Wait for search to process
      await page.waitForTimeout(300);
      
      // Check that results are filtered
      const visibleItems = page.locator('.category-card li:not(.is-hidden)');
      const count = await visibleItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('search status shows result count', async ({ page }) => {
      const searchInput = page.locator('#search-input');
      await searchInput.fill('windows');
      
      await page.waitForTimeout(300);
      
      const status = page.locator('#search-status');
      await expect(status).toContainText('sonuç');
    });

    test('pressing Escape clears search', async ({ page }) => {
      const searchInput = page.locator('#search-input');
      await searchInput.fill('test query');
      await searchInput.press('Escape');
      
      await expect(searchInput).toHaveValue('');
    });

    test('keyboard shortcut / focuses search', async ({ page }) => {
      // Click somewhere else first
      await page.locator('body').click();
      await page.keyboard.press('/');
      
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toBeFocused();
    });

    test('keyboard shortcut Ctrl+K focuses search', async ({ page }) => {
      await page.locator('body').click();
      await page.keyboard.press('Control+k');
      
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toBeFocused();
    });
  });

  test.describe('Favorites Functionality', () => {
    test('favorites sidebar is visible when favorites exist', async ({ page }) => {
      const sidebar = page.locator('#favorites-sidebar');
      // Default favorites should be loaded
      await expect(sidebar).toBeVisible();
    });

    test('clicking favorite button toggles favorite state', async ({ page }) => {
      // Find a favorite button
      const favBtn = page.locator('.fav-btn').first();
      await favBtn.waitFor({ state: 'visible' });
      
      const wasActive = await favBtn.evaluate(el => el.classList.contains('active'));
      await favBtn.click();
      
      // Check state changed
      const isActive = await favBtn.evaluate(el => el.classList.contains('active'));
      expect(isActive).toBe(!wasActive);
    });

    test('favorites persist after page reload', async ({ page }) => {
      // Toggle a favorite
      const favBtn = page.locator('.fav-btn').first();
      await favBtn.click();
      
      // Get the name
      const name = await favBtn.getAttribute('data-name');
      const wasActive = await favBtn.evaluate(el => el.classList.contains('active'));
      
      // Reload page
      await page.reload();
      await page.waitForSelector('#links-container');
      
      // Find the same button
      const sameFavBtn = page.locator(`.fav-btn[data-name="${name}"]`).first();
      const isActive = await sameFavBtn.evaluate(el => el.classList.contains('active'));
      
      expect(isActive).toBe(wasActive);
    });
  });

  test.describe('Copy Functionality', () => {
    test('copy button is visible for items with commands', async ({ page }) => {
      const copyBtn = page.locator('.copy-button').first();
      if (await copyBtn.count() > 0) {
        await expect(copyBtn).toBeVisible();
      }
    });

    test('clicking copy button shows success state', async ({ page }) => {
      const copyBtn = page.locator('.copy-button').first();
      if (await copyBtn.count() > 0) {
        await copyBtn.click();
        
        // Should show copied state
        await expect(copyBtn).toHaveClass(/copied/);
        
        // Should reset after 2 seconds
        await page.waitForTimeout(2500);
        await expect(copyBtn).not.toHaveClass(/copied/);
      }
    });
  });

  test.describe('Category Navigation', () => {
    test('category cards are rendered', async ({ page }) => {
      const cards = page.locator('.category-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('category has title with icon', async ({ page }) => {
      const firstCard = page.locator('.category-card').first();
      const title = firstCard.locator('h2');
      await expect(title).toBeVisible();
      
      // Check for icon
      const icon = title.locator('.category-icon');
      if (await icon.count() > 0) {
        await expect(icon).toBeVisible();
      }
    });

    test('links within categories are clickable', async ({ page }) => {
      const link = page.locator('.category-card li a[href]').first();
      await expect(link).toBeVisible();
      
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);
    });
  });

  test.describe('Accessibility', () => {
    test('skip link is present', async ({ page }) => {
      const skipLink = page.locator('.skip-link');
      await expect(skipLink).toBeAttached();
    });

    test('main content has proper role', async ({ page }) => {
      const main = page.locator('#main-content');
      await expect(main).toHaveAttribute('aria-label');
    });

    test('search has proper ARIA attributes', async ({ page }) => {
      const search = page.locator('search[role="search"]');
      await expect(search).toBeVisible();
      
      const input = page.locator('#search-input');
      await expect(input).toHaveAttribute('aria-describedby', 'search-status');
    });
  });

  test.describe('Responsive Design', () => {
    test('works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toBeVisible();
      
      const cards = page.locator('.category-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe('Info Tooltips', () => {
    test('info button shows tooltip on click', async ({ page }) => {
      const infoBtn = page.locator('.info-button').first();
      if (await infoBtn.count() > 0) {
        await infoBtn.click();
        
        const tooltip = page.locator('.custom-tooltip.visible');
        await expect(tooltip).toBeVisible();
      }
    });

    test('clicking backdrop closes tooltip', async ({ page }) => {
      const infoBtn = page.locator('.info-button').first();
      if (await infoBtn.count() > 0) {
        await infoBtn.click();
        
        const backdrop = page.locator('#tooltip-backdrop');
        await backdrop.click({ force: true });
        
        const tooltip = page.locator('.custom-tooltip.visible');
        await expect(tooltip).toHaveCount(0);
      }
    });
  });
});
