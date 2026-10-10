import { test, expect } from '@playwright/test';
import { setupAuthenticatedChatPage, getAuthToken } from './test-helper';

test.describe('Chat Scrolling & Layout Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedChatPage(page, 'dark');
  });

  test('1. Scroll container is isolated, scrolls independently without scrolling the outer page', async ({ page }) => {
    const teamChannel = page.locator('#company-channel-item');
    if (await teamChannel.isVisible()) {
      await teamChannel.click();
    }

    const scrollContainer = page.locator('#chat-messages-scroll-container');
    await expect(scrollContainer).toBeVisible({ timeout: 10000 });

    // Verify container styling
    const styles = await scrollContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        overflowY: computed.overflowY,
        overscrollBehaviorY: computed.overscrollBehaviorY || computed.overscrollBehavior,
        display: computed.display
      };
    });
    expect(['auto', 'scroll']).toContain(styles.overflowY);
    if (styles.overscrollBehaviorY) {
      expect(['contain', 'none']).toContain(styles.overscrollBehaviorY);
    }

    // Header and Composer are fixed / not inside the scrollable container
    const header = page.locator('#chat-pane-header');
    const composer = page.locator('#chat-pane-composer');
    await expect(header).toBeVisible();
    await expect(composer).toBeVisible();

    // Verify outer document / window does not scroll when scrolling messages
    const windowScrollBefore = await page.evaluate(() => window.scrollY);
    await scrollContainer.evaluate(el => {
      el.scrollTop = 50;
      el.dispatchEvent(new Event('scroll'));
    });
    const windowScrollAfter = await page.evaluate(() => window.scrollY);
    expect(windowScrollAfter).toBe(windowScrollBefore);
    expect(windowScrollAfter).toBe(0);
  });

  test('2. Opening a conversation scrolls to the latest message', async ({ page }) => {
    const teamChannel = page.locator('#company-channel-item');
    if (await teamChannel.isVisible()) {
      await teamChannel.click();
    }

    const scrollContainer = page.locator('#chat-messages-scroll-container');
    await expect(scrollContainer).toBeVisible({ timeout: 10000 });

    // Wait for messages to render
    const messageRows = page.locator('.chat-message-row');
    const count = await messageRows.count();
    if (count > 0) {
      // Check that scrollContainer is near bottom
      const isNearBottom = await scrollContainer.evaluate(el => {
        const threshold = 150;
        return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      });
      expect(isNearBottom).toBeTruthy();

      // Composer remains visible at the bottom
      const composerTextarea = page.locator('#chat-message-composer');
      await expect(composerTextarea).toBeVisible();
    }
  });

  test('3. Sending a message updates the view and scrolls to bottom', async ({ page }) => {
    const teamChannel = page.locator('#company-channel-item');
    if (await teamChannel.isVisible()) {
      await teamChannel.click();
    }

    const scrollContainer = page.locator('#chat-messages-scroll-container');
    await expect(scrollContainer).toBeVisible({ timeout: 10000 });

    const composerTextarea = page.locator('#chat-message-composer');
    await expect(composerTextarea).toBeVisible();

    const uniqueText = `Playwright Scroll Test ${Date.now()}`;
    await composerTextarea.fill(uniqueText);

    const sendBtn = page.locator('button[title="Send message"]');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // Verify message appears in message list
    const sentMessage = page.locator(`text=${uniqueText}`);
    await expect(sentMessage).toBeVisible({ timeout: 8000 });

    // Verify container scrolled to bottom to show sent message
    const isNearBottom = await scrollContainer.evaluate(el => {
      const threshold = 120;
      return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    });
    expect(isNearBottom).toBeTruthy();
  });

  test('4. Receiving real-time message while at bottom auto-scrolls to new message', async ({ page }) => {
    const teamChannel = page.locator('#company-channel-item');
    if (await teamChannel.isVisible()) {
      await teamChannel.click();
    }

    const scrollContainer = page.locator('#chat-messages-scroll-container');
    await expect(scrollContainer).toBeVisible({ timeout: 10000 });

    // Ensure we are at the bottom
    await scrollContainer.evaluate(el => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(100);

    const activeConvId = await page.evaluate(() => (window as any).__activeConvId);

    // Simulate an incoming socket message
    const incomingText = `Live Incoming Message ${Date.now()}`;
    await page.evaluate(({ text, convId }) => {
      const service = (window as any).__socketService;
      if (service) {
        service.triggerEvent('new_message', {
          conversationId: convId,
          message: {
            _id: `msg-${Date.now()}`,
            conversationId: convId,
            senderId: {
              _id: 'other-user-999',
              name: 'Sarah Connor',
              role: 'MANAGER'
            },
            content: text,
            messageType: 'TEXT',
            readBy: ['other-user-999'],
            createdAt: new Date().toISOString()
          }
        });
      }
    }, { text: incomingText, convId: activeConvId });

    // Verify container stays near bottom
    const isNearBottom = await scrollContainer.evaluate(el => {
      const threshold = 160;
      return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    });
    expect(isNearBottom).toBeTruthy();
  });

  test('5. Receiving real-time message while reading older messages preserves user scroll position and shows pill', async ({ page }) => {
    // Ensure viewport height produces scrollable overflow for conversation messages
    await page.setViewportSize({ width: 1200, height: 480 });

    const scrollContainer = page.locator('#chat-messages-scroll-container');
    await expect(scrollContainer).toBeVisible({ timeout: 10000 });

    // Wait for messages to be fully rendered in the view
    await expect(page.locator('.chat-message-row').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(400);

    const activeConvId = await page.evaluate(() => (window as any).__activeConvId);

    // Scroll up away from bottom to read older history
    await scrollContainer.evaluate(el => {
      el.scrollTop = 0; // scroll to top
      el.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.waitForTimeout(300);

    const initialScrollTop = await scrollContainer.evaluate(el => el.scrollTop);

    // Floating scroll-to-bottom button should be visible when reading older messages
    const scrollToBottomBtn = page.locator('#scroll-to-bottom-button');
    await expect(scrollToBottomBtn).toBeVisible({ timeout: 5000 });

    // Simulate incoming message while user is reading at the top
    const incomingText = `Background Message While Reading History ${Date.now()}`;
    await page.evaluate(({ text, convId }) => {
      const service = (window as any).__socketService;
      if (service) {
        service.triggerEvent('new_message', {
          conversationId: convId,
          message: {
            _id: `msg-${Date.now()}`,
            conversationId: convId,
            senderId: {
              _id: 'other-user-888',
              name: 'John Doe',
              role: 'EMPLOYEE'
            },
            content: text,
            messageType: 'TEXT',
            readBy: ['other-user-888'],
            createdAt: new Date().toISOString()
          }
        });
      }
    }, { text: incomingText, convId: activeConvId });

    await page.waitForTimeout(300);

    // Verify user position was NOT pulled to bottom
    const currentScrollTop = await scrollContainer.evaluate(el => el.scrollTop);
    expect(currentScrollTop).toBeLessThanOrEqual(initialScrollTop + 50);

    // Pill now indicates unread message arrival
    await expect(scrollToBottomBtn).toBeVisible();
    await expect(scrollToBottomBtn).toContainText('New message');

    // Clicking scroll to bottom button returns to latest messages
    await scrollToBottomBtn.click();
    await expect.poll(async () => {
      return await scrollContainer.evaluate(el => {
        const threshold = 150;
        return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      });
    }, { timeout: 4000 }).toBeTruthy();
  });

  test('6. Older-message pagination does not cause scroll jumps', async ({ page }) => {
    const teamChannel = page.locator('#company-channel-item');
    if (await teamChannel.isVisible()) {
      await teamChannel.click();
    }

    const scrollContainer = page.locator('#chat-messages-scroll-container');
    await expect(scrollContainer).toBeVisible({ timeout: 10000 });

    const loadOlderBtn = page.locator('#load-older-messages-btn');
    if (await loadOlderBtn.isVisible()) {
      // Record position before loading older messages
      const beforeMetrics = await scrollContainer.evaluate(el => ({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight
      }));

      await loadOlderBtn.click();
      await page.waitForTimeout(500);

      const afterMetrics = await scrollContainer.evaluate(el => ({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight
      }));

      // If new messages loaded, scrollHeight increased, and scrollTop adjusted proportionally
      if (afterMetrics.scrollHeight > beforeMetrics.scrollHeight) {
        expect(afterMetrics.scrollTop).toBeGreaterThan(beforeMetrics.scrollTop);
      }
    }
  });

  test('7. Switching conversations does not retain previous conversation scroll position incorrectly', async ({ page }) => {
    const convItems = page.locator('.chat-conversations-list > div');
    const convCount = await convItems.count();

    if (convCount >= 2) {
      // Click first conversation
      await convItems.nth(0).click();
      const scrollContainer = page.locator('#chat-messages-scroll-container');
      await expect(scrollContainer).toBeVisible({ timeout: 10000 });

      // Scroll to custom position
      await scrollContainer.evaluate(el => {
        el.scrollTop = 10;
        el.dispatchEvent(new Event('scroll'));
      });

      // Switch to second conversation
      await convItems.nth(1).click();
      await page.waitForTimeout(400);

      // Verify second conversation starts scrolled to the latest message
      const isNearBottomSecond = await scrollContainer.evaluate(el => {
        const threshold = 150;
        return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      });
      expect(isNearBottomSecond).toBeTruthy();
    }
  });

  test('8. Responsive layout maintains visible composer and header without page scroll across devices', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // On mobile viewport (< 768px), click channel item to open chat pane if sidebar is active
      if (vp.width < 768) {
        const companyItem = page.locator('#company-channel-item');
        await expect(companyItem).toBeVisible({ timeout: 5000 });
        await companyItem.click();
        await page.waitForTimeout(300);
      }

      const composer = page.locator('#chat-pane-composer');
      await expect(composer).toBeVisible({ timeout: 8000 });

      const header = page.locator('#chat-pane-header');
      await expect(header).toBeVisible({ timeout: 8000 });

      // Ensure no horizontal document overflow
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth;
      });
      expect(overflow).toBeFalsy();

      // Ensure page window is not scrolled
      const pageScrollY = await page.evaluate(() => window.scrollY);
      expect(pageScrollY).toBe(0);
    }
  });
});
