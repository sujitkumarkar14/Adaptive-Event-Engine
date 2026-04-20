import { test, expect } from '@playwright/test';

/**
 * Semantic alignment: waiting times & slot booking — ingress booking is behind Identity Gate.
 */
test.describe('waiting time — booking (shell)', () => {
  test('booking route redirects to login', async ({ page }) => {
    await page.goto('/booking');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });

  test('vouchers surface is similarly protected', async ({ page }) => {
    await page.goto('/vouchers');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
