import { test, expect } from '@playwright/test';

/**
 * When a global emergency is active, attendee surfaces must stay coherent after sign-in.
 * Without Firebase auth in CI, we assert the booking entry point is gated like other flows.
 * Deeper behavior (phase EMERGENCY + booking UI) is covered in unit tests: `Booking.emergency.spec.tsx`.
 */
test.describe('emergency during booking (shell)', () => {
  test('booking route requires sign-in before any mid-flow emergency UX', async ({ page }) => {
    await page.goto('/booking');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible();
  });

  test('dashboard and booking both redirect consistently when unauthenticated', async ({ page }) => {
    await page.goto('/booking');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
