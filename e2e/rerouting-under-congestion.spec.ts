import { test, expect } from '@playwright/test';

/**
 * Scenario: congestion triggers staff routing policy; attendee sees reroute guidance after auth.
 * Unauthenticated: dashboard (wayfinding / reroute surface) is behind Identity Gate.
 */
test.describe('rerouting under congestion (shell)', () => {
  test('dashboard route requires sign-in — congestion UX is post-auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible();
  });

  test('staff command traffic view requires sign-in', async ({ page }) => {
    await page.goto('/command/traffic');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
