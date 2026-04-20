import { test, expect } from '@playwright/test';

/**
 * Shell coverage for “emergency coordination” surfaces: unauthenticated users must
 * pass Identity Gate before staff or attendee tools; aligns with problem-statement
 * real-time coordination without requiring live FCM in CI.
 */
test.describe('emergency coordination (shell)', () => {
  test('login exposes skip link and Identity Gate heading', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /skip to primary content/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible();
  });

  test('staff dashboard is behind auth', async ({ page }) => {
    await page.goto('/staff');
    await expect(page).toHaveURL(/\/login/);
  });

  test('command traffic route is behind auth', async ({ page }) => {
    await page.goto('/command/traffic');
    await expect(page).toHaveURL(/\/login/);
  });
});
