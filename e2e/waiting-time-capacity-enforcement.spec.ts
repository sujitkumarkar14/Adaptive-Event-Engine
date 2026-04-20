import { test, expect } from '@playwright/test';

/** Semantic alignment: waiting times — booking entry is gated until identity is established. */
test.describe('waiting time — capacity enforcement (shell)', () => {
  test('booking route is protected before slot selection', async ({ page }) => {
    await page.goto('/booking');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible();
  });
});
