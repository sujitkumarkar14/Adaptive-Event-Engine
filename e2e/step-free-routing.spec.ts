import { test, expect } from '@playwright/test';

test.describe('step-free / keyboard shell', () => {
  test('skip link is focusable on login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
    const skip = page.getByRole('link', { name: /skip to primary content/i });
    await skip.focus();
    await expect(skip).toBeFocused();
  });
});
