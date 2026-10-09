import { test, expect } from '@playwright/test';
import { getAuthToken } from './test-helper';

test.describe('Create Announcement Modal - Button Colors and Theme', () => {
  test.beforeEach(async ({ page }) => {
    const token = await getAuthToken();
    await page.addInitScript(
      ({ tok }) => {
        localStorage.setItem('lavanta_jwt_token', tok);
      },
      { tok: token }
    );
  });

  test('Dark Mode: Target Audience, Departments, Inputs, and Upload Area', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lavanta_crm_theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    await page.goto('http://localhost:5173/announcements');
    await page.waitForLoadState('domcontentloaded');

    // Click "Create Announcement" to open the drawer
    const createBtn = page.getByRole('button', { name: 'Create Announcement' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Verify modal drawer is visible
    const drawerHeading = page.getByRole('heading', { name: 'Create Announcement' });
    await expect(drawerHeading).toBeVisible();

    // 1. Target Audience Buttons
    const audienceGroup = page.getByRole('group', { name: 'Target Audience' });
    await expect(audienceGroup).toBeVisible();

    const everyoneBtn = audienceGroup.getByRole('button', { name: 'Everyone' });
    const deptAudienceBtn = audienceGroup.getByRole('button', { name: 'Department' });
    const roleBtn = audienceGroup.getByRole('button', { name: 'Specific Role' });
    const usersBtn = audienceGroup.getByRole('button', { name: 'Specific Users' });

    // Founder default targetType is EVERYONE -> Selected
    await expect(everyoneBtn).toHaveClass(/selected/);
    await expect(everyoneBtn).toHaveCSS('background-color', 'rgb(23, 48, 33)'); // #173021
    await expect(everyoneBtn).toHaveCSS('color', 'rgb(121, 223, 89)'); // #79DF59
    await expect(everyoneBtn).toHaveCSS('border-color', 'rgb(101, 201, 67)'); // #65C943
    await expect(everyoneBtn).toHaveCSS('font-weight', '600');

    // Inactive audience button (e.g. 'Department'):
    await expect(deptAudienceBtn).not.toHaveClass(/selected/);
    await expect(deptAudienceBtn).toHaveCSS('background-color', 'rgb(23, 33, 49)'); // #172131
    await expect(deptAudienceBtn).toHaveCSS('color', 'rgb(165, 180, 199)'); // #A5B4C7
    await expect(deptAudienceBtn).toHaveCSS('border-color', 'rgb(52, 66, 86)'); // #344256

    // Hover state on inactive audience button
    await deptAudienceBtn.hover();
    await page.waitForTimeout(300);
    const deptHoverBg = await deptAudienceBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const deptHoverColor = await deptAudienceBtn.evaluate(el => window.getComputedStyle(el).color);
    expect(deptHoverBg).toBe('rgb(28, 41, 58)'); // #1C293A
    expect(deptHoverColor).toBe('rgb(241, 245, 249)'); // #F1F5F9

    // Keyboard focus ring on audience button
    await deptAudienceBtn.focus();
    await page.waitForTimeout(300);
    const deptFocusShadow = await deptAudienceBtn.evaluate(el => window.getComputedStyle(el).boxShadow);
    expect(deptFocusShadow).toContain('101, 201, 67'); // #65C943 green focus ring

    // Click 'Department' audience button to activate Department selection
    await deptAudienceBtn.click();
    await expect(deptAudienceBtn).toHaveClass(/selected/);
    await expect(everyoneBtn).not.toHaveClass(/selected/);

    // Selected Department audience button styling:
    await expect(deptAudienceBtn).toHaveCSS('background-color', 'rgb(23, 48, 33)'); // #173021
    await expect(deptAudienceBtn).toHaveCSS('color', 'rgb(121, 223, 89)'); // #79DF59
    await expect(deptAudienceBtn).toHaveCSS('border-color', 'rgb(101, 201, 67)'); // #65C943

    // 2. Department Selection Buttons
    // Check all 7 departments: Marketing, Product, R&D, Operations, Sales, Finance, HR
    const departments = ['Marketing', 'Product', 'R&D', 'Operations', 'Sales', 'Finance', 'HR'];
    for (const dept of departments) {
      const deptBtn = page.getByRole('button', { name: dept, exact: true });
      await expect(deptBtn).toBeVisible();

      // Inactive department button style:
      await expect(deptBtn).toHaveCSS('background-color', 'rgb(23, 33, 49)'); // #172131
      await expect(deptBtn).toHaveCSS('color', 'rgb(192, 204, 218)'); // #C0CCDA
      await expect(deptBtn).toHaveCSS('border-color', 'rgb(52, 66, 86)'); // #344256
    }

    // Click 'Marketing' to select it
    const marketingBtn = page.getByRole('button', { name: 'Marketing', exact: true });
    await marketingBtn.click();
    await expect(marketingBtn).toHaveClass(/selected/);

    // Selected department styling in dark mode:
    await expect(marketingBtn).toHaveCSS('background-color', 'rgb(23, 48, 33)'); // #173021
    await expect(marketingBtn).toHaveCSS('color', 'rgb(121, 223, 89)'); // #79DF59
    await expect(marketingBtn).toHaveCSS('border-color', 'rgb(101, 201, 67)'); // #65C943
    await expect(marketingBtn).toHaveCSS('font-weight', '600');

    // 3. Dropdowns (Type & Priority)
    const typeSelect = page.locator('select').first();
    await expect(typeSelect).toBeVisible();
    await expect(typeSelect).toHaveCSS('background-color', 'rgb(13, 22, 36)'); // var(--bg-input) in dark mode
    await expect(typeSelect).toHaveCSS('color', 'rgb(244, 247, 250)'); // var(--color-text-primary)

    // 4. Image Upload Area
    const uploadArea = page.locator('.announcement-upload-area');
    await expect(uploadArea).toBeVisible();
    await expect(uploadArea).toHaveCSS('background-color', 'rgb(13, 22, 36)'); // #0D1624
    await expect(uploadArea).toHaveCSS('border-color', 'rgb(38, 53, 72)'); // #263548
    await expect(uploadArea).toHaveCSS('border-style', 'dashed');
  });

  test('Light Mode: Target Audience and Department Styling', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lavanta_crm_theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });

    await page.goto('http://localhost:5173/announcements');
    const createBtn = page.getByRole('button', { name: 'Create Announcement' });
    await createBtn.click();

    const audienceGroup = page.getByRole('group', { name: 'Target Audience' });
    const everyoneBtn = audienceGroup.getByRole('button', { name: 'Everyone' });
    const deptAudienceBtn = audienceGroup.getByRole('button', { name: 'Department' });

    // Active in light mode: Soft green accent
    await expect(everyoneBtn).toHaveClass(/selected/);
    await expect(everyoneBtn).toHaveCSS('background-color', 'rgb(234, 247, 230)'); // #EAF7E6
    await expect(everyoneBtn).toHaveCSS('color', 'rgb(46, 125, 26)'); // #2E7D1A
    await expect(everyoneBtn).toHaveCSS('border-color', 'rgb(88, 200, 58)'); // #58C83A

    // Inactive in light mode: #FFFFFF bg, #475569 text
    await expect(deptAudienceBtn).not.toHaveClass(/selected/);
    await expect(deptAudienceBtn).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(deptAudienceBtn).toHaveCSS('color', 'rgb(71, 85, 105)'); // #475569

    // Click 'Department' and verify department buttons in light mode
    await deptAudienceBtn.click();
    const productBtn = page.getByRole('button', { name: 'Product', exact: true });
    await expect(productBtn).toBeVisible();
    await expect(productBtn).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(productBtn).toHaveCSS('color', 'rgb(71, 85, 105)');

    await productBtn.click();
    await expect(productBtn).toHaveClass(/selected/);
    await expect(productBtn).toHaveCSS('background-color', 'rgb(234, 247, 230)');
    await expect(productBtn).toHaveCSS('color', 'rgb(46, 125, 26)');
  });
});
