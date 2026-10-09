import { Page, expect } from '@playwright/test';

let cachedToken: string | null = null;

export async function getAuthToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'founder@lavantanaturals.com',
      password: 'Lavanta@Founder123'
    })
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error('Failed to obtain authentication token: ' + JSON.stringify(data));
  }
  cachedToken = data.token;
  return data.token;
}

export async function setupAuthenticatedChatPage(page: Page, theme: 'dark' | 'light' = 'dark'): Promise<void> {
  const token = await getAuthToken();

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

  // Navigate directly to /chat
  await page.goto('http://localhost:5173/chat');
  await page.waitForLoadState('domcontentloaded');
  // Wait for sidebar and search input to render
  await page.waitForSelector('.chat-search-container', { state: 'visible', timeout: 10000 });
}
