import { test, expect } from '@playwright/test';
import { setupAuthenticatedChatPage } from './test-helper';

const VIEWPORTS = [
  { name: 'Small mobile', width: 320, height: 568 },
  { name: 'Standard mobile', width: 375, height: 812 },
  { name: 'Large mobile', width: 430, height: 932 },
  { name: 'Tablet portrait', width: 768, height: 1024 },
  { name: 'Tablet landscape', width: 1024, height: 768 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'Wide desktop', width: 1920, height: 1080 }
];

test.describe('Responsive Viewport Tests', () => {
  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}): Header, search and chat layout adapt without overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await setupAuthenticatedChatPage(page, 'dark');

      // 1. Verify no horizontal overflow across entire document
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth
        };
      });
      expect(overflow.hasOverflow).toBeFalsy();

      // 2. Global search field adapts to available width without overlapping
      const headerSearchBtn = page.locator('#header-global-search-btn');
      await expect(headerSearchBtn).toBeVisible();

      const searchBtnBox = await headerSearchBtn.boundingBox();
      expect(searchBtnBox).not.toBeNull();
      if (searchBtnBox) {
        expect(searchBtnBox.x + searchBtnBox.width).toBeLessThanOrEqual(vp.width);
      }

      // 3. Message search container stays within its parent
      const chatSearchContainer = page.locator('.chat-search-container');
      await expect(chatSearchContainer).toBeVisible();

      const searchContainerMetrics = await chatSearchContainer.evaluate(el => {
        const parent = el.parentElement;
        const parentRect = parent ? parent.getBoundingClientRect() : null;
        const elRect = el.getBoundingClientRect();
        return {
          elWidth: elRect.width,
          parentWidth: parentRect ? parentRect.width : 0,
          staysWithinParent: parentRect ? elRect.right <= parentRect.right + 2 : true
        };
      });
      expect(searchContainerMetrics.staysWithinParent).toBeTruthy();

      // 4. Search icon and input remain properly positioned
      const searchInput = page.locator('#chat-search-input');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('Search Test');
      await expect(searchInput).toHaveValue('Search Test');
      await searchInput.fill('');

      // 5. Sidebar and chat panels remain usable
      if (vp.width < 768) {
        // On mobile, single column: clicking a conversation opens chat pane with Back button
        const teamChannel = page.locator('text=Lavanta Team').first();
        if (await teamChannel.isVisible()) {
          await teamChannel.click();
          // Mobile back button should appear
          const backBtn = page.locator('button[title*="Back to conversations"]').first();
          await expect(backBtn).toBeVisible();
          // Click back to return to sidebar
          await backBtn.click();
          await expect(chatSearchContainer).toBeVisible();
        }
      } else {
        // On tablet/desktop, two-column layout: both sidebar and right pane visible
        const chatSidebar = page.locator('.chat-search-container');
        await expect(chatSidebar).toBeVisible();
        const mainContainer = page.locator('#chat-page-container');
        await expect(mainContainer).toBeVisible();
        const chatPane = page.locator('#chat-pane-wrapper');
        await expect(chatPane).toBeVisible();
      }
    });
  }
});
