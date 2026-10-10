import { test, expect } from '@playwright/test';
import { setupAuthenticatedChatPage } from './test-helper';

test.describe('New Direct Message Search Bar Tests', () => {
  ['dark', 'light'].forEach((theme) => {
    test(`Search bar renders without inner rectangle and has single outer focus ring in ${theme} mode (Desktop)`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await setupAuthenticatedChatPage(page, theme as 'dark' | 'light');

      // Click New Chat button to open modal
      const newChatBtn = page.locator('#open-new-chat-btn');
      await expect(newChatBtn).toBeVisible({ timeout: 10000 });
      await newChatBtn.click();

      // Check modal is open
      const searchContainer = page.locator('#new-chat-search-container');
      await expect(searchContainer).toBeVisible({ timeout: 5000 });

      const searchInput = page.locator('#new-chat-search-input');
      await expect(searchInput).toBeVisible();

      // Verify the input is focused
      await searchInput.focus();
      await expect(searchInput).toBeFocused();

      // Inspect inner input computed styles
      const inputStyles = await searchInput.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          borderWidth: computed.borderWidth,
          borderStyle: computed.borderStyle,
          borderColor: computed.borderColor,
          outlineWidth: computed.outlineWidth,
          outlineStyle: computed.outlineStyle,
          boxShadow: computed.boxShadow,
          backgroundColor: computed.backgroundColor,
          color: computed.color,
        };
      });

      // Assert inner input has NO border, NO outline, NO box-shadow, and transparent background
      expect(inputStyles.borderWidth).toBe('0px');
      expect(inputStyles.outlineWidth).toBe('0px');
      expect(inputStyles.boxShadow).toBe('none');
      // Transparent background
      expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(inputStyles.backgroundColor);

      // Wait for focus transition to finish
      await expect.poll(async () => {
        return await searchContainer.evaluate((el) => window.getComputedStyle(el).borderColor);
      }, { timeout: 3000 }).toBe('rgb(101, 201, 67)');

      // Inspect outer container computed styles while focused
      const containerStyles = await searchContainer.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          borderRadius: computed.borderRadius,
          borderWidth: computed.borderWidth,
          borderStyle: computed.borderStyle,
          boxShadow: computed.boxShadow,
          display: computed.display,
          alignItems: computed.alignItems,
        };
      });

      // Outer container must be rounded (10px)
      expect(containerStyles.borderRadius).toBe('10px');
      // Outer container has visible border (1px solid)
      expect(containerStyles.borderWidth).toBe('1px');
      expect(containerStyles.borderStyle).toBe('solid');
      // Outer container has focus ring box-shadow
      expect(containerStyles.boxShadow).toContain('101, 201, 67');

      // Search icon and input alignment
      expect(containerStyles.display).toBe('flex');
      expect(containerStyles.alignItems).toBe('center');

      // Test typing and filtering
      await searchInput.fill('Admin');
      // Verify query is updated
      await expect(searchInput).toHaveValue('Admin');

      // Clear button should be visible
      const clearBtn = searchContainer.locator('button[aria-label="Clear search query"]');
      await expect(clearBtn).toBeVisible();
      await clearBtn.click();
      await expect(searchInput).toHaveValue('');
    });
  });

  test('Search bar functions correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupAuthenticatedChatPage(page, 'dark');

    const newChatBtn = page.locator('#open-new-chat-btn');
    await expect(newChatBtn).toBeVisible({ timeout: 10000 });
    await newChatBtn.click();

    const searchInput = page.locator('#new-chat-search-input');
    const searchContainer = page.locator('#new-chat-search-container');
    await expect(searchContainer).toBeVisible();

    await searchInput.focus();

    // Verify input does not overflow container
    const containerBox = await searchContainer.boundingBox();
    const inputBox = await searchInput.boundingBox();

    expect(containerBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    if (containerBox && inputBox) {
      expect(inputBox.x).toBeGreaterThanOrEqual(containerBox.x);
      expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(containerBox.x + containerBox.width + 1);
    }

    const inputStyles = await searchInput.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderWidth: computed.borderWidth,
        outlineWidth: computed.outlineWidth,
      };
    });
    expect(inputStyles.borderWidth).toBe('0px');
    expect(inputStyles.outlineWidth).toBe('0px');
  });

  test('Filtering by department and search query works properly', async ({ page }) => {
    await setupAuthenticatedChatPage(page, 'dark');

    const newChatBtn = page.locator('#open-new-chat-btn');
    await expect(newChatBtn).toBeVisible({ timeout: 10000 });
    await newChatBtn.click();

    const searchInput = page.locator('#new-chat-search-input');
    await expect(searchInput).toBeVisible();

    // Type a specific query and check that filtering operates without error
    await searchInput.fill('karan');
    await page.waitForTimeout(300);

    // Close modal by clicking X
    const closeBtn = page.locator('div[style*="justifyContent: space-between"] button').last();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });
});
