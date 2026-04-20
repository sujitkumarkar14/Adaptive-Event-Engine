import { test, expect } from '@playwright/test';

/** Semantic alignment: crowd movement — consistent gating for wayfinding routes. */
test.describe('crowd movement consistency (shell)', () => {
  test('dashboard and command traffic both require sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/command/traffic');
    await expect(page).toHaveURL(/\/login/);
  });
});
