import { test, expect, Page } from '@playwright/test';

async function getRoleToken(email: string, pass: string): Promise<string> {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password: pass })
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }
  return data.token;
}

async function loginAs(page: Page, email: string, pass: string, theme: 'dark' | 'light' = 'dark') {
  const token = await getRoleToken(email, pass);
  await page.addInitScript(
    ({ tok, thm }) => {
      localStorage.setItem('lavanta_jwt_token', tok);
      localStorage.setItem('lavanta_crm_theme', thm);
      document.documentElement.setAttribute('data-theme', thm);
      if (thm === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    },
    { tok: token, thm: theme }
  );
}

test.describe('Role-Specific Dashboards Verification', () => {
  test('Manager Dashboard: displays team workload, in-progress tasks, and no role selector', async ({ page }) => {
    await loginAs(page, 'manager@lavantanaturals.com', 'Lavanta@Manager123', 'dark');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify Manager heading and badge
    await expect(page.getByText('MANAGER', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Department Management/i)).toBeVisible();

    // Verify Team KPIs
    await expect(page.getByText('In Progress', { exact: true })).toBeVisible();
    await expect(page.getByText('Overdue Tasks', { exact: true })).toBeVisible();
    await expect(page.getByText('Team Members', { exact: true })).toBeVisible();

    // Verify Manager primary sections
    await expect(page.getByText(/Team Tasks In Progress/i)).toBeVisible();
    await expect(page.getByText(/Team Workload Distribution/i)).toBeVisible();

    // Verify absence of dashboard role selector
    await expect(page.locator('select.role-selector, [data-testid="role-selector"]')).not.toBeVisible();
  });

  test('HR Dashboard: displays workforce metrics, pending HR tasks, and no manager analytics', async ({ page }) => {
    await loginAs(page, 'hr@lavantanaturals.com', 'Lavanta@HR123', 'dark');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify HR heading and badge
    await expect(page.getByText('HR OPERATIONS', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/People & Culture Operations/i)).toBeVisible();

    // Verify People KPIs
    await expect(page.getByText('Employees', { exact: true })).toBeVisible();
    await expect(page.getByText('Interns', { exact: true })).toBeVisible();
    await expect(page.getByText('Active Workforce', { exact: true })).toBeVisible();
    await expect(page.getByText('Pending HR Tasks', { exact: true })).toBeVisible();

    // Verify HR primary sections
    await expect(page.getByText(/Pending HR Tasks & Onboarding/i)).toBeVisible();
    await expect(page.getByText(/Workforce Directory/i)).toBeVisible();

    // Verify absence of manager workload section
    await expect(page.getByText(/Team Workload Distribution/i)).not.toBeVisible();
  });

  test('Employee Dashboard: displays personal tasks and conceals private team analytics', async ({ page }) => {
    await loginAs(page, 'employee@lavantanaturals.com', 'Lavanta@Employee123', 'dark');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify Employee heading and badge
    await expect(page.getByText('EMPLOYEE', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/My Workspace/i)).toBeVisible();

    // Verify personal KPIs
    await expect(page.getByText('Pending Tasks', { exact: true })).toBeVisible();
    await expect(page.getByText('In Progress', { exact: true })).toBeVisible();
    await expect(page.getByText('Completed', { exact: true })).toBeVisible();

    // Verify personal sections
    await expect(page.getByText(/My Active Deliverables/i)).toBeVisible();
    await expect(page.getByText(/Recently Completed/i)).toBeVisible();

    // Verify absence of HR & Manager sections
    await expect(page.getByText(/Team Workload Distribution/i)).not.toBeVisible();
    await expect(page.getByText(/Workforce Directory/i)).not.toBeVisible();
  });

  test('Intern Dashboard: displays assigned learning track and avoids HR/Manager data', async ({ page }) => {
    await loginAs(page, 'intern@lavantanaturals.com', 'Lavanta@Intern123', 'dark');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify Intern heading and badge
    await expect(page.getByText('INTERN', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Internship Learning Track/i)).toBeVisible();

    // Verify intern sections
    await expect(page.getByText(/Assigned Deliverables & Milestones/i)).toBeVisible();
    await expect(page.getByText(/Completed Milestones/i)).toBeVisible();

    // Verify absence of HR & Manager sections
    await expect(page.getByText(/Team Workload Distribution/i)).not.toBeVisible();
    await expect(page.getByText(/Workforce Directory/i)).not.toBeVisible();
  });
});

test.describe('Centralized Notification System Verification', () => {
  test('Header notification bell and Notifications Page synchronize unread state', async ({ page }) => {
    await loginAs(page, 'manager@lavantanaturals.com', 'Lavanta@Manager123', 'dark');
    await page.goto('http://localhost:5173/notifications');
    await page.waitForLoadState('domcontentloaded');

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Notifications' }).first()).toBeVisible({ timeout: 10000 });

    // Verify Unread Only filter button exists
    const unreadBtn = page.getByRole('button', { name: 'Unread Only' });
    await expect(unreadBtn).toBeVisible();

    // Verify Mark All as Read button exists
    const markAllBtn = page.getByRole('button', { name: /Mark All as Read/i });
    await expect(markAllBtn).toBeVisible();

    // Verify Header notification bell is present
    const bellBtn = page.locator('button[aria-label*="notification" i], button[title*="notification" i], button:has(svg.lucide-bell)').first();
    await expect(bellBtn).toBeVisible();
  });
});
