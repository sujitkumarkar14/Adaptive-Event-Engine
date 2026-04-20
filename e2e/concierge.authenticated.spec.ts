import { test, expect } from '@playwright/test';

const hasAuth = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const describeAuth = hasAuth ? test.describe : test.describe.skip;

describeAuth('concierge translation (authenticated)', () => {
  test('manual query shows translated or echoed result', async ({ page }) => {
    await page.goto('/concierge');
    await page.getByLabel(/Ask for directions or assistance/i).fill('Where is the nearest step-free gate?');
    await page.getByRole('button', { name: /Submit \(Cloud Translation\)/i }).click();
    await expect(page.getByRole('status')).toBeVisible({ timeout: 45_000 });
  });
});
