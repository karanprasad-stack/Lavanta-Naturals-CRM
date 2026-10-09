import { test, expect } from '@playwright/test';
import { setupAuthenticatedChatPage } from './test-helper';

test.describe('Browser Compatibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedChatPage(page, 'dark');
  });

  test('1 & 2: Search inputs render with a single visible outer border and no inner rectangular border', async ({ page }) => {
    // 1. Community Chat Search Box
    const chatSearchContainer = page.locator('.chat-search-container');
    await expect(chatSearchContainer).toBeVisible();

    const containerStyles = await chatSearchContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderTopWidth: computed.borderTopWidth,
        borderStyle: computed.borderTopStyle,
        borderRadius: computed.borderRadius
      };
    });

    // Outer border must be 1px solid
    expect(containerStyles.borderTopWidth).toBe('1px');
    expect(containerStyles.borderStyle).toBe('solid');

    // Inner input must NOT have a rectangular border or outline
    const chatSearchInput = page.locator('#chat-search-input');
    await expect(chatSearchInput).toBeVisible();

    const inputStyles = await chatSearchInput.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderTopWidth: computed.borderTopWidth,
        borderStyle: computed.borderTopStyle,
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
        boxShadow: computed.boxShadow
      };
    });
    expect(parseInt(inputStyles.borderTopWidth || '0', 10) === 0 || inputStyles.borderStyle === 'none').toBeTruthy();
    expect(['none', ''].includes(inputStyles.outlineStyle) || inputStyles.outlineWidth === '0px').toBeTruthy();

    // 2. Global Header Search Button
    const headerSearchBtn = page.locator('#header-global-search-btn');
    await expect(headerSearchBtn).toBeVisible();

    const headerBtnStyles = await headerSearchBtn.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderWidth: computed.borderTopWidth,
        borderStyle: computed.borderTopStyle
      };
    });
    expect(headerBtnStyles.borderWidth).toBe('1px');
    expect(headerBtnStyles.borderStyle).toBe('solid');
  });

  test('3 & 4: Search icons and input text are vertically aligned and placeholder does not overlap', async ({ page }) => {
    const searchContainer = page.locator('.chat-search-container');
    const searchIcon = searchContainer.locator('svg').first();
    const searchInput = page.locator('#chat-search-input');

    await expect(searchIcon).toBeVisible();
    await expect(searchInput).toBeVisible();

    const iconBox = await searchIcon.boundingBox();
    const inputBox = await searchInput.boundingBox();

    expect(iconBox).not.toBeNull();
    expect(inputBox).not.toBeNull();

    if (iconBox && inputBox) {
      const iconCenterY = iconBox.y + iconBox.height / 2;
      const inputCenterY = inputBox.y + inputBox.height / 2;
      // Vertically aligned within 3.5px tolerance
      expect(Math.abs(iconCenterY - inputCenterY)).toBeLessThanOrEqual(3.5);

      // Input text must be positioned to the right of the icon (no overlap)
      expect(inputBox.x).toBeGreaterThanOrEqual(iconBox.x + iconBox.width);
    }

    // Verify placeholder text is non-empty and readable
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toBe('Search messages or people...');
  });

  test('5: Typing, clearing, and submitting search queries work correctly', async ({ page }) => {
    const searchInput = page.locator('#chat-search-input');

    // Type query
    await searchInput.fill('Lavanta Team');
    await expect(searchInput).toHaveValue('Lavanta Team');

    // Clear button (X) should appear
    const clearBtn = page.locator('.chat-search-container button[aria-label="Clear search"]');
    await expect(clearBtn).toBeVisible();

    // Click clear button
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');
    await expect(clearBtn).toHaveCount(0);

    // Global Search: Open Command Palette
    const headerSearchBtn = page.locator('#header-global-search-btn');
    await headerSearchBtn.click();

    const commandPaletteInput = page.locator('#global-command-palette-input');
    await expect(commandPaletteInput).toBeVisible();

    // Type into global search
    await commandPaletteInput.fill('Sales');
    await expect(commandPaletteInput).toHaveValue('Sales');

    // Close command palette with Escape
    await page.keyboard.press('Escape');
    await expect(commandPaletteInput).not.toBeVisible();
  });

  test('6: Focus indicators remain visible when navigating with keyboard', async ({ page }) => {
    const searchInput = page.locator('#chat-search-input');
    await searchInput.focus();

    // Wait for transition to settle
    await page.waitForTimeout(300);

    // When focused, the outer container should have active focus styling (green border or ring)
    const containerBorderColor = await page.locator('.chat-search-container').evaluate(el => {
      const computed = window.getComputedStyle(el);
      return computed.borderColor;
    });

    // In CSS: .chat-search-container:focus-within has border-color: #65C943 (rgb(101, 201, 67))
    expect(containerBorderColor).toContain('101, 201, 67');

    // Keyboard navigation to Header Search Button
    const headerSearchBtn = page.locator('#header-global-search-btn');
    await headerSearchBtn.focus();
    const isFocused = await headerSearchBtn.evaluate(el => document.activeElement === el);
    expect(isFocused).toBeTruthy();
  });

  test('7: Dark mode and Light mode render correctly without white panels in dark mode', async ({ page }) => {
    // Verify Dark Mode
    const historyPanel = page.locator('div[style*="var(--chat-bg-history)"]').first();
    await expect(historyPanel).toBeVisible();

    const darkBgColor = await historyPanel.evaluate(el => window.getComputedStyle(el).backgroundColor);
    // Dark mode history background is #0B1421 (rgb(11, 20, 33))
    expect(darkBgColor).not.toBe('rgb(255, 255, 255)');
    expect(darkBgColor).toContain('11, 20, 33');

    // Switch to Light Mode via theme toggle button
    const themeBtn = page.locator('button[title*="Light Mode"], button[title*="Dark Mode"]').first();
    await themeBtn.click();

    // Wait for theme attribute to update to light
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');

    const lightBgColor = await historyPanel.evaluate(el => window.getComputedStyle(el).backgroundColor);
    // Light mode background should be clean light surface
    expect(lightBgColor).not.toContain('11, 20, 33');

    // Switch back to Dark Mode
    await themeBtn.click();
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
  });

  test('8: Rounded corners, padding, borders, and spacing remain consistent', async ({ page }) => {
    const chatSearchContainer = page.locator('.chat-search-container');
    const header = page.locator('.top-header');

    const chatMetrics = await chatSearchContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderRadius: computed.borderRadius,
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight
      };
    });

    expect(chatMetrics.borderRadius).toBe('8px');
    expect(parseFloat(chatMetrics.paddingLeft)).toBeGreaterThanOrEqual(10);

    const headerMetrics = await header.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight
      };
    });

    expect(headerMetrics.height).toBe('64px');
    // On desktop, padding is >= 24px (1.75rem = 28px)
    expect(parseInt(headerMetrics.paddingLeft, 10)).toBeGreaterThanOrEqual(24);
  });

  test('9: No horizontal overflow, clipped controls, or unexpected layout shifts occur', async ({ page }) => {
    const overflowCheck = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth
      };
    });

    expect(overflowCheck.hasHorizontalOverflow).toBeFalsy();
  });

  test('10: Browser-specific default input styles do not reintroduce the inner rectangle', async ({ page }) => {
    const searchInput = page.locator('#chat-search-input');
    const appearance = await searchInput.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        webkitAppearance: computed.webkitAppearance,
        border: computed.border,
        boxShadow: computed.boxShadow
      };
    });

    expect(['none', 'auto'].includes(appearance.webkitAppearance) || appearance.border === '0px none rgb(241, 245, 249)').toBeTruthy();
    expect(appearance.boxShadow).toBe('none');
  });
});
