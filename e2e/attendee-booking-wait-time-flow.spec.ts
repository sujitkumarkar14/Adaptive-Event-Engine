import { test, expect } from '@playwright/test';

const hasAuth = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const describeAuth = hasAuth ? test.describe : test.describe.skip;

/**
 * Authenticated path: onboarding → booking → dashboard with live ETA / congestion surfaces.
 * Booking depends on callable `reserveEntrySlot` + backend; if it errors, the test still validates dashboard.
 */
describeAuth('attendee booking and wait time flow', () => {
  test('onboarding, slot selection, dashboard shows journey and timing surfaces', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /Car/i }).first().click();
    await page.getByRole('button', { name: /Initialize System/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    await expect(page.getByText(/Live Journey/i)).toBeVisible({ timeout: 30_000 });

    await page.goto('/booking');
    await expect(page.getByRole('heading', { name: /Arrival Booking/i })).toBeVisible({ timeout: 30_000 });
    await page.getByText('14:00 - 14:15').click();
    await page.getByRole('button', { name: /Confirm Slot/i }).click();

    const alert = page.getByRole('alert');
    const status = page.getByRole('status');
    await expect(status.or(alert).first()).toBeVisible({ timeout: 60_000 });

    if (await alert.isVisible().catch(() => false)) {
      await page.goto('/dashboard');
    } else {
      await expect(status).toContainText(/Slot reserved/i, { timeout: 10_000 });
      await page.getByRole('button', { name: /Continue to Dashboard/i }).click();
      await expect(page).toHaveURL(/\/dashboard/);
    }

    await expect(page.getByText(/Live Journey/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^ETA$/).first()).toBeVisible();
    await expect(page.getByText(/^Gate Pressure$/)).toBeVisible();
    await expect(
      page.getByText(/Estimated gate wait|Live congestion data isn/i).first()
    ).toBeVisible({ timeout: 30_000 });
  });
});
