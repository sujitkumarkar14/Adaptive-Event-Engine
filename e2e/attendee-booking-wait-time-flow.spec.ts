import { test, expect } from '@playwright/test';

const hasAuth = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const describeAuth = hasAuth ? test.describe : test.describe.skip;

/**
 * Authenticated path: onboarding → booking → dashboard with live ETA / congestion surfaces.
 * `reserveEntrySlot` is stubbed so the flow can assert a successful booking without Spanner.
 */
describeAuth('attendee booking and wait time flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*reserveEntrySlot*', async (route) => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result: {
            data: {
              status: 'SUCCESS',
              message: 'Slot reserved.',
              transactionId: 'e2e-tx',
            },
          },
        }),
      });
    });
  });

  test('onboarding, slot selection, successful booking, dashboard shows journey and timing surfaces', async ({
    page,
  }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /Car/i }).first().click();
    await page.getByRole('button', { name: /Initialize System/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    await expect(page.getByText(/Live Journey/i)).toBeVisible({ timeout: 30_000 });

    await page.goto('/booking');
    await expect(page.getByRole('heading', { name: /Arrival Booking/i })).toBeVisible({ timeout: 30_000 });
    await page.getByText('14:00 - 14:15').click();
    await page.getByRole('button', { name: /Confirm Slot/i }).click();

    await expect(page.getByText(/Slot reserved.*e2e-tx/i)).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: /Continue to Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByText(/Live Journey/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^ETA$/).first()).toBeVisible();
    await expect(page.getByText(/^Gate Pressure$/)).toBeVisible();
    await expect(
      page.getByText(/Estimated gate wait|Live congestion data isn/i).first()
    ).toBeVisible({ timeout: 30_000 });
  });
});
