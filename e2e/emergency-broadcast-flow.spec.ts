import { test, expect } from '@playwright/test';

/**
 * Scenario: global emergency state + broadcast (FCN / Firestore) — full path needs auth + functions.
 * Shell: login exposes skip link and primary heading for inclusive egress comms entry.
 */
test.describe('emergency broadcast flow (shell)', () => {
  test('login screen is reachable with skip link and main landmark', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('#main-content')).toBeVisible();
    const skip = page.getByRole('link', { name: /skip to primary content/i });
    await skip.focus();
    await expect(skip).toBeFocused();
  });

  test('unauthenticated users cannot open staff-only command surfaces', async ({ page }) => {
    await page.goto('/command/gates');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
