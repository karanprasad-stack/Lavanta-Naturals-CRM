import { test, expect } from '@playwright/test';
import { getAuthToken } from './test-helper';

test.describe('Expenses Module - Filter Button Colors', () => {
  test.beforeEach(async ({ page }) => {
    const token = await getAuthToken();
    await page.addInitScript(
      ({ tok }) => {
        localStorage.setItem('lavanta_jwt_token', tok);
      },
      { tok: token }
    );
  });

  test('Dark Mode Styling: Active, Inactive, Hover, and Focus ring', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lavanta_crm_theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    await page.goto('http://localhost:5173/expenses');
    await page.waitForSelector('.expense-filter-group', { timeout: 10000 });

    const filterGroup = page.locator('.expense-filter-group');
    await expect(filterGroup).toBeVisible();

    const allButtons = filterGroup.locator('.expense-filter-btn');
    await expect(allButtons).toHaveCount(5);

    // Filter labels: All Expenses, Pending Review, Approved, Paid, Rejected
    const expectedLabels = ['All Expenses', 'Pending Review', 'Approved', 'Paid', 'Rejected'];
    for (let i = 0; i < expectedLabels.length; i++) {
      await expect(allButtons.nth(i)).toHaveText(expectedLabels[i]);
    }

    // Default active button: 'All Expenses'
    const activeBtn = allButtons.filter({ hasText: 'All Expenses' });
    await expect(activeBtn).toHaveClass(/active/);

    // Active button in dark mode:
    // Background: #65C943 (rgb(101, 201, 67))
    // Text: #08120A (rgb(8, 18, 10))
    // Font weight: 600
    const activeStyles = await activeBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
        fontWeight: s.fontWeight,
        borderRadius: s.borderRadius
      };
    });

    expect(activeStyles.bg).toBe('rgb(101, 201, 67)');
    expect(activeStyles.color).toBe('rgb(8, 18, 10)');
    expect(activeStyles.fontWeight).toBe('600');
    expect(activeStyles.borderRadius).toBe('9999px');

    // Inactive button in dark mode (e.g. 'Pending Review'):
    // Background: #111827 (rgb(17, 24, 39))
    // Text: #A5B4C7 (rgb(165, 180, 199))
    // Border: 1px solid #293548 (rgb(41, 53, 72))
    // Font weight: 500
    const pendingBtn = allButtons.filter({ hasText: 'Pending Review' });
    await expect(pendingBtn).not.toHaveClass(/active/);

    const inactiveStyles = await pendingBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
        borderColor: s.borderColor,
        fontWeight: s.fontWeight
      };
    });

    expect(inactiveStyles.bg).toBe('rgb(17, 24, 39)'); // #111827 - never white!
    expect(inactiveStyles.color).toBe('rgb(165, 180, 199)'); // #A5B4C7
    expect(inactiveStyles.borderColor).toBe('rgb(41, 53, 72)'); // #293548
    expect(inactiveStyles.fontWeight).toBe('500');

    // Test hover state on inactive button:
    await pendingBtn.hover();
    await page.waitForTimeout(300); // Wait for transition to complete
    const hoverStyles = await pendingBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, borderColor: s.borderColor };
    });
    expect(hoverStyles.bg).toBe('rgb(28, 41, 58)'); // #1C293A
    expect(hoverStyles.color).toBe('rgb(241, 245, 249)'); // #F1F5F9
    expect(hoverStyles.borderColor).toBe('rgb(64, 81, 106)'); // #40516A

    // Move mouse away to clear hover
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

    // Test switching: Click 'Pending Review'
    await pendingBtn.click();
    await expect(pendingBtn).toHaveClass(/active/);
    await expect(activeBtn).not.toHaveClass(/active/);

    // Now 'Pending Review' is active green (#65C943)
    await expect(pendingBtn).toHaveCSS('background-color', 'rgb(101, 201, 67)');
    await expect(pendingBtn).toHaveCSS('color', 'rgb(8, 18, 10)');
    await expect(pendingBtn).toHaveCSS('font-weight', '600');

    // Test switching through all 5 filters
    for (const label of ['Approved', 'Paid', 'Rejected', 'All Expenses']) {
      const btn = allButtons.filter({ hasText: label });
      await btn.click();
      await expect(btn).toHaveClass(/active/);
      await expect(btn).toHaveCSS('background-color', 'rgb(101, 201, 67)');
      await expect(btn).toHaveCSS('color', 'rgb(8, 18, 10)');
    }

    // Keyboard focus: Focus on 'Approved'
    const approvedBtn = allButtons.filter({ hasText: 'Approved' });
    await approvedBtn.focus();
    await page.waitForTimeout(300);
    const focusBoxShadow = await approvedBtn.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(focusBoxShadow).toContain('101, 201, 67');
  });

  test('Light Mode Styling: Active, Inactive, and Switching', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lavanta_crm_theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });

    await page.goto('http://localhost:5173/expenses');
    await page.waitForSelector('.expense-filter-group', { timeout: 10000 });

    const allButtons = page.locator('.expense-filter-group .expense-filter-btn');
    const allExpensesBtn = allButtons.filter({ hasText: 'All Expenses' });
    const pendingBtn = allButtons.filter({ hasText: 'Pending Review' });

    // Active in light mode: #65C943 background, #08120A text, 600 weight
    const activeStyles = await allExpensesBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, fontWeight: s.fontWeight };
    });
    expect(activeStyles.bg).toBe('rgb(101, 201, 67)');
    expect(activeStyles.color).toBe('rgb(8, 18, 10)');
    expect(activeStyles.fontWeight).toBe('600');

    // Inactive in light mode: #FFFFFF bg, #475569 (rgb(71, 85, 105)) text, #DDE5DA (rgb(221, 229, 218)) border, 500 weight
    const inactiveStyles = await pendingBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
        borderColor: s.borderColor,
        fontWeight: s.fontWeight
      };
    });
    expect(inactiveStyles.bg).toBe('rgb(255, 255, 255)');
    expect(inactiveStyles.color).toBe('rgb(71, 85, 105)');
    expect(inactiveStyles.borderColor).toBe('rgb(221, 229, 218)');
    expect(inactiveStyles.fontWeight).toBe('500');
  });
});
