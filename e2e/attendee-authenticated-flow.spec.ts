import { test, expect } from '@playwright/test';

const hasAuth = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const describeAuth = hasAuth ? test.describe : test.describe.skip;

describeAuth('authenticated attendee journey', () => {
  test('login, onboarding, dashboard shell', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email/i }).fill(process.env.E2E_TEST_EMAIL!);
    await page.getByLabel(/^Password$/i).fill(process.env.E2E_TEST_PASSWORD!);
    await page.getByRole('button', { name: /^Sign In$/i }).click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 60_000 });
    await page.getByRole('button', { name: /Car/i }).first().click();
    await page.getByRole('button', { name: /Initialize System/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { name: /Live Journey/i })).toBeVisible({ timeout: 30_000 });
  });
});
