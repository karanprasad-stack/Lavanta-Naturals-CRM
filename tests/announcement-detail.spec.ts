import { test, expect } from '@playwright/test';
import { getAuthToken } from './test-helper';

// Helper to convert rgb(r, g, b) to hex
function rgbToHex(rgb: string): string {
  if (!rgb) return '';
  if (rgb.startsWith('#')) return rgb.toLowerCase();
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const hex = (x: string) => parseInt(x, 10).toString(16).padStart(2, '0');
  return `#${hex(match[1])}${hex(match[2])}${hex(match[3])}`.toLowerCase();
}

test.describe('Announcement Details Page - Button Colors & Layout', () => {
  const ANNOUNCEMENTS_LIST_URL = 'http://localhost:5173/announcements';

  test.beforeEach(async ({ page }) => {
    const token = await getAuthToken();
    await page.addInitScript(
      ({ tok }) => {
        localStorage.setItem('lavanta_jwt_token', tok);
      },
      { tok: token }
    );
  });

  test('Dark Mode: Header Action Buttons & Contrast', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lavanta_crm_theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    await page.goto(ANNOUNCEMENTS_LIST_URL);
    await page.waitForLoadState('domcontentloaded');

    // Click first announcement card
    const firstCard = page.locator('.announcement-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // Verify detail page has loaded
    await page.waitForSelector('.announcement-detail-header', { timeout: 10000 });

    const backBtn = page.getByRole('button', { name: 'Back to Announcements' });
    const calBtn = page.getByRole('button', { name: /Add to Calendar|View in Calendar/ });
    const receiptsBtn = page.getByRole('button', { name: 'Read Receipts' });
    const deleteBtn = page.getByRole('button', { name: 'Delete Announcement' });

    await expect(backBtn).toBeVisible();
    await expect(calBtn).toBeVisible();
    await expect(receiptsBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();

    // 1. Back to Announcements (Dark)
    // Background: #172131, Text/Icon: #E2E8F0, Border: #344256
    const backBg = await backBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const backColor = await backBtn.evaluate((el) => window.getComputedStyle(el).color);
    const backBorder = await backBtn.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(rgbToHex(backBg)).toBe('#172131');
    expect(rgbToHex(backColor)).toBe('#e2e8f0');
    expect(rgbToHex(backBorder)).toBe('#344256');

    // 2. Add to Calendar (Dark)
    // Background: #173021, Text/Icon: #79DF59, Border: #377D36
    const calBg = await calBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const calColor = await calBtn.evaluate((el) => window.getComputedStyle(el).color);
    const calBorder = await calBtn.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(rgbToHex(calBg)).toBe('#173021');
    expect(rgbToHex(calColor)).toBe('#79df59');
    expect(rgbToHex(calBorder)).toBe('#377d36');

    // 3. Read Receipts (Dark)
    // Background: #172131, Text/Icon: #E2E8F0, Border: #344256
    const recBg = await receiptsBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const recColor = await receiptsBtn.evaluate((el) => window.getComputedStyle(el).color);
    const recBorder = await receiptsBtn.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(rgbToHex(recBg)).toBe('#172131');
    expect(rgbToHex(recColor)).toBe('#e2e8f0');
    expect(rgbToHex(recBorder)).toBe('#344256');

    // 4. Delete Announcement (Dark)
    // Background: #30191E, Icon: #FB7185, Border: #74313D
    const delBg = await deleteBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const delColor = await deleteBtn.evaluate((el) => window.getComputedStyle(el).color);
    const delBorder = await deleteBtn.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(rgbToHex(delBg)).toBe('#30191e');
    expect(rgbToHex(delColor)).toBe('#fb7185');
    expect(rgbToHex(delBorder)).toBe('#74313d');

    // 5. Button dimensions & alignment
    const backHeight = await backBtn.evaluate((el) => el.getBoundingClientRect().height);
    const calHeight = await calBtn.evaluate((el) => el.getBoundingClientRect().height);
    const delHeight = await deleteBtn.evaluate((el) => el.getBoundingClientRect().height);
    const delWidth = await deleteBtn.evaluate((el) => el.getBoundingClientRect().width);

    expect(backHeight).toBe(36);
    expect(calHeight).toBe(36);
    expect(delHeight).toBe(36);
    expect(delWidth).toBe(36);

    // 6. Test Hover States in Dark Mode
    await backBtn.hover();
    await page.waitForTimeout(250);
    const backHoverBg = await backBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(rgbToHex(backHoverBg)).toBe('#243247');

    await calBtn.hover();
    await page.waitForTimeout(250);
    const calHoverBg = await calBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(rgbToHex(calHoverBg)).toBe('#21432b');

    await deleteBtn.hover();
    await page.waitForTimeout(250);
    const delHoverBg = await deleteBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(rgbToHex(delHoverBg)).toBe('#48212a');

    // 7. Test Read Receipts modal opening
    await receiptsBtn.click();
    const modalHeading = page.getByRole('heading', { name: /Read Receipts/i });
    await expect(modalHeading).toBeVisible({ timeout: 5000 });
    // Close modal
    const closeBtn = page.getByRole('button', { name: /Close|Done/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('Light Mode: Header Action Buttons & Contrast', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lavanta_crm_theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });

    await page.goto(ANNOUNCEMENTS_LIST_URL);
    await page.waitForLoadState('domcontentloaded');

    const firstCard = page.locator('.announcement-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    await page.waitForSelector('.announcement-detail-header', { timeout: 10000 });

    const backBtn = page.getByRole('button', { name: 'Back to Announcements' });
    const calBtn = page.getByRole('button', { name: /Add to Calendar|View in Calendar/ });
    const receiptsBtn = page.getByRole('button', { name: 'Read Receipts' });
    const deleteBtn = page.getByRole('button', { name: 'Delete Announcement' });

    // 1. Back button (Light)
    // Background: #FFFFFF, Text: #1E293B, Border: #CBD5E1
    const backBg = await backBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const backColor = await backBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(rgbToHex(backBg)).toBe('#ffffff');
    expect(rgbToHex(backColor)).toBe('#1e293b');

    // 2. Add to Calendar (Light)
    // Background: #EAF7E6, Text: #2E7D1A, Border: #86EFAC
    const calBg = await calBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const calColor = await calBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(rgbToHex(calBg)).toBe('#eaf7e6');
    expect(rgbToHex(calColor)).toBe('#2e7d1a');

    // 3. Read Receipts (Light)
    const recBg = await receiptsBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const recColor = await receiptsBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(rgbToHex(recBg)).toBe('#ffffff');
    expect(rgbToHex(recColor)).toBe('#1e293b');

    // 4. Delete Announcement (Light)
    // Background: #FEF2F2, Icon: #DC2626, Border: #FECACA
    const delBg = await deleteBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const delColor = await deleteBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(rgbToHex(delBg)).toBe('#fef2f2');
    expect(rgbToHex(delColor)).toBe('#dc2626');
  });

  test('Responsive Viewports: 375px Mobile, 768px Tablet, 1366px Laptop, 1920px Desktop', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lavanta_crm_theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1366, height: 768, name: 'laptop' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(ANNOUNCEMENTS_LIST_URL);
      await page.waitForLoadState('domcontentloaded');

      const firstCard = page.locator('.announcement-card').first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });
      await firstCard.click();

      await page.waitForSelector('.announcement-detail-header', { timeout: 10000 });

      const backBtn = page.getByRole('button', { name: 'Back to Announcements' });
      const actionsGroup = page.locator('.announcement-detail-actions');

      await expect(backBtn).toBeVisible();
      await expect(actionsGroup).toBeVisible();

      // Ensure buttons don't clip horizontally or overflow screen width
      const headerBox = await page.locator('.announcement-detail-header').boundingBox();
      expect(headerBox?.width).toBeLessThanOrEqual(vp.width);
    }
  });
});
