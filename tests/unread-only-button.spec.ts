import { test, expect } from '@playwright/test';
import { getAuthToken } from './test-helper';

function rgbToHex(rgb: string): string {
  if (!rgb) return '';
  if (rgb.startsWith('#')) return rgb.toLowerCase();
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const hex = (x: string) => parseInt(x, 10).toString(16).padStart(2, '0');
  return `#${hex(match[1])}${hex(match[2])}${hex(match[3])}`.toLowerCase();
}

test.describe('Unread Only Filter Button - Theme & Functionality', () => {
  const ANNOUNCEMENTS_URL = 'http://localhost:5173/announcements';

  test.beforeEach(async ({ page }) => {
    const token = await getAuthToken();
    await page.addInitScript(
      ({ tok }) => {
        localStorage.setItem('lavanta_jwt_token', tok);
      },
      { tok: token }
    );
  });

  test('Dark Mode: Inactive, Active, Hover, and Focus states', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lavanta_crm_theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    await page.goto(ANNOUNCEMENTS_URL);
    await page.waitForLoadState('domcontentloaded');

    const unreadBtn = page.getByRole('button', { name: 'Unread Only' });
    await expect(unreadBtn).toBeVisible({ timeout: 10000 });

    // 1. Inactive State (Dark Mode)
    // Background: #172131, Text: #A5B4C7, Border: #344256
    await expect(unreadBtn).not.toHaveClass(/active/);
    const inactBg = await unreadBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const inactColor = await unreadBtn.evaluate(el => window.getComputedStyle(el).color);
    const inactBorder = await unreadBtn.evaluate(el => window.getComputedStyle(el).borderColor);

    expect(rgbToHex(inactBg)).toBe('#172131');
    expect(rgbToHex(inactColor)).toBe('#a5b4c7');
    expect(rgbToHex(inactBorder)).toBe('#344256');

    // 2. Inactive Hover State (Dark Mode)
    // Background: #243247, Text: #F1F5F9
    await unreadBtn.hover();
    await page.waitForTimeout(250);
    const hovBg = await unreadBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const hovColor = await unreadBtn.evaluate(el => window.getComputedStyle(el).color);
    expect(rgbToHex(hovBg)).toBe('#243247');
    expect(rgbToHex(hovColor)).toBe('#f1f5f9');

    // 3. Click to toggle Active State (Dark Mode)
    // Background: #173021, Text: #79DF59, Border: #377D36, Font-weight: 600
    await unreadBtn.click();
    await expect(unreadBtn).toHaveClass(/active/);
    await page.waitForTimeout(250);

    const actBg = await unreadBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const actColor = await unreadBtn.evaluate(el => window.getComputedStyle(el).color);
    const actBorder = await unreadBtn.evaluate(el => window.getComputedStyle(el).borderColor);
    const actWeight = await unreadBtn.evaluate(el => window.getComputedStyle(el).fontWeight);

    expect(rgbToHex(actBg)).toBe('#173021');
    expect(rgbToHex(actColor)).toBe('#79df59');
    expect(rgbToHex(actBorder)).toBe('#377d36');
    expect(parseInt(actWeight, 10)).toBeGreaterThanOrEqual(600);

    // 4. Hovering while Active must NEVER override active state
    await unreadBtn.hover();
    await page.waitForTimeout(250);
    const actHovBg = await unreadBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const actHovColor = await unreadBtn.evaluate(el => window.getComputedStyle(el).color);
    expect(rgbToHex(actHovBg)).toBe('#173021');
    expect(rgbToHex(actHovColor)).toBe('#79df59');

    // 5. Keyboard Focus State
    await unreadBtn.focus();
    const focusOutline = await unreadBtn.evaluate(el => window.getComputedStyle(el).outlineColor);
    const focusShadow = await unreadBtn.evaluate(el => window.getComputedStyle(el).boxShadow);
    expect(rgbToHex(focusOutline) === '#65c943' || focusShadow.includes('101, 201, 67')).toBeTruthy();

    // 6. Click again to toggle back to inactive
    await unreadBtn.click();
    await expect(unreadBtn).not.toHaveClass(/active/);
  });

  test('Light Mode: Inactive, Active, Hover, and Toggle states', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lavanta_crm_theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });

    await page.goto(ANNOUNCEMENTS_URL);
    await page.waitForLoadState('domcontentloaded');

    const unreadBtn = page.getByRole('button', { name: 'Unread Only' });
    await expect(unreadBtn).toBeVisible({ timeout: 10000 });

    // 1. Inactive State (Light Mode)
    // Background: #FFFFFF, Text: #475569, Border: #DDE5DA
    await expect(unreadBtn).not.toHaveClass(/active/);
    const inactBg = await unreadBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const inactColor = await unreadBtn.evaluate(el => window.getComputedStyle(el).color);
    const inactBorder = await unreadBtn.evaluate(el => window.getComputedStyle(el).borderColor);

    expect(rgbToHex(inactBg)).toBe('#ffffff');
    expect(rgbToHex(inactColor)).toBe('#475569');
    expect(rgbToHex(inactBorder)).toBe('#dde5da');

    // 2. Inactive Hover State (Light Mode)
    // Background: #F1F5EF
    await unreadBtn.hover();
    await page.waitForTimeout(250);
    const hovBg = await unreadBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(rgbToHex(hovBg)).toBe('#f1f5ef');

    // 3. Click to toggle Active State (Light Mode)
    // Background: #E8F7E2, Text: #287D20, Border: #65C943, Font-weight: 600
    await unreadBtn.click();
    await expect(unreadBtn).toHaveClass(/active/);
    await page.waitForTimeout(250);

    const actBg = await unreadBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const actColor = await unreadBtn.evaluate(el => window.getComputedStyle(el).color);
    const actBorder = await unreadBtn.evaluate(el => window.getComputedStyle(el).borderColor);
    const actWeight = await unreadBtn.evaluate(el => window.getComputedStyle(el).fontWeight);

    expect(rgbToHex(actBg)).toBe('#e8f7e2');
    expect(rgbToHex(actColor)).toBe('#287d20');
    expect(rgbToHex(actBorder)).toBe('#65c943');
    expect(parseInt(actWeight, 10)).toBeGreaterThanOrEqual(600);

    // 4. Click again to toggle back to inactive, move mouse away to sample unhovered background
    await unreadBtn.click();
    await expect(unreadBtn).not.toHaveClass(/active/);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(250);

    const backToInactBg = await unreadBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(rgbToHex(backToInactBg)).toBe('#ffffff');
  });

  test('Functionality: Filter toggling updates displayed announcement cards', async ({ page }) => {
    await page.goto(ANNOUNCEMENTS_URL);
    await page.waitForLoadState('domcontentloaded');

    const unreadBtn = page.getByRole('button', { name: 'Unread Only' });
    await expect(unreadBtn).toBeVisible({ timeout: 10000 });

    // Wait for initial announcement cards to render
    await expect(page.locator('.announcement-card').first()).toBeVisible({ timeout: 10000 });
    const initialCardsCount = await page.locator('.announcement-card').count();
    expect(initialCardsCount).toBeGreaterThan(0);

    // Toggle unread only
    await unreadBtn.click();
    await expect(unreadBtn).toHaveClass(/active/);
    await page.waitForTimeout(500);

    // Toggle back to all
    await unreadBtn.click();
    await expect(unreadBtn).not.toHaveClass(/active/);
    await page.waitForTimeout(500);

    const finalCardsCount = await page.locator('.announcement-card').count();
    expect(finalCardsCount).toBe(initialCardsCount);
  });
});
