import { test, expect } from '@playwright/test';

/**
 * Rapid navigation between wayfinding / staff / booking surfaces.
 * Validates the shell does not stick on a stale route when unauthenticated; latest navigation wins.
 */
test.describe('rapid reroute updates (shell)', () => {
  test('churning routes ends on login with Identity Gate visible', async ({ page }) => {
    const routes = ['/dashboard', '/booking', '/staff', '/command/traffic', '/dashboard', '/booking'];
    for (const r of routes) {
      await page.goto(r);
      await expect(page).toHaveURL(/\/login/);
    }
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
  });

  test('last navigation target is authoritative', async ({ page }) => {
    await page.goto('/login');
    await page.goto('/booking');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/staff');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible();
  });
});
