import { test, expect } from '@playwright/test';

const hasAuth = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const describeAuth = hasAuth ? test.describe : test.describe.skip;

describeAuth('wait time awareness flow', () => {
  test('dashboard exposes gate pressure and ETA with live polite regions', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/Live Journey/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/^Gate Pressure$/)).toBeVisible();
    await expect(page.getByText(/^ETA$/)).toBeVisible();
    await expect(page.locator('[aria-live="polite"]').first()).toBeAttached();
  });
});
