import { test, expect } from '@playwright/test';

/**
 * Scenario: attendee selects ingress slot and confirms via callable (Spanner-backed in prod).
 * Shell: booking route redirects until Identity Gate is satisfied.
 */
test.describe('attendee slot booking flow (shell)', () => {
  test('booking route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/booking');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible();
  });

  test('onboarding is protected like booking', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
