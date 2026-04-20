import { test, expect } from '@playwright/test';

test.describe('attendee protected routes', () => {
  test('booking route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/booking');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
