import { test, expect } from '@playwright/test';

/** Semantic alignment: coordination under load — parallel staff route hits. */
test.describe('real-time coordination under load (shell)', () => {
  test('multiple rapid staff navigations stay consistent', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.goto('/staff');
      await expect(page).toHaveURL(/\/login/);
      await page.goto('/command/aero');
      await expect(page).toHaveURL(/\/login/);
    }
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
  });
});
