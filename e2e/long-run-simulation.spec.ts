import { test, expect } from '@playwright/test';

/**
 * Long-run shell stability: repeated navigation between protected routes without drift.
 * (Keeps iteration count bounded for CI time.)
 */
test.describe('long-run navigation simulation', () => {
  test('alternating dashboard and booking stays gated consistently', async ({ page }) => {
    const iterations = 35;
    for (let i = 0; i < iterations; i++) {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
      await page.goto('/booking');
      await expect(page).toHaveURL(/\/login/);
    }
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
  });
});
