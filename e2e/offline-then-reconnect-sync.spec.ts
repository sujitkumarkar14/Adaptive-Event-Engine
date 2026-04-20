import { test, expect } from '@playwright/test';

/**
 * Offline → online cycle: navigator hooks and URL stability for the login shell.
 * Full Firestore sync after reconnect needs staging + auth (see RESILIENCE.md).
 */
test.describe('offline then reconnect sync', () => {
  test('login route and heading remain after offline cycle', async ({ page, context }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });

    await context.setOffline(true);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
    await expect(page).toHaveURL(/\/login/);

    await context.setOffline(false);
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
  });

  test('reload after reconnect still shows login gate', async ({ page, context }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
    await context.setOffline(true);
    await context.setOffline(false);
    await page.reload();
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
  });
});
