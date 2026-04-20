import { test, expect } from '@playwright/test';

/**
 * Validates browser offline/online hooks used by the app (`online` / `offline` events → entry store).
 * Authenticated “Sync Status: Offline” in the shell requires a signed-in session; see Vitest
 * `offline-network.integration.spec.tsx` for component-level proof.
 */
test.describe('offline recovery — connectivity hooks', () => {
  test('navigator.onLine toggles when context goes offline and online', async ({ page, context }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });

    await context.setOffline(true);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);

    await context.setOffline(false);
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
  });

  test('stays on login route through offline cycle once shell has rendered', async ({ page, context }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
    await context.setOffline(true);
    await expect(page).toHaveURL(/\/login/);
    await context.setOffline(false);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
  });
});
