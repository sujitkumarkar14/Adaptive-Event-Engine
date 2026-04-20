import { test, expect } from '@playwright/test';

test.describe('production build smoke', () => {
  test('login screen shows Identity Gate heading', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({
      timeout: 90_000,
    });
  });

  test('unauthenticated root resolves to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
