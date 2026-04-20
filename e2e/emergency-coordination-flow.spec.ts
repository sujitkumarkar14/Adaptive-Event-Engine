import { test, expect } from '@playwright/test';

const hasAuth = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const describeAuth = hasAuth ? test.describe : test.describe.skip;

/**
 * Requires `VITE_ENABLE_CHAOS_CONTROLLER` at build time (see `npm run e2e:preview` / Playwright webServer).
 */
describeAuth('emergency coordination flow', () => {
  test('evacuation drill is keyboard-reachable and surfaces live emergency copy', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/Live Journey/i)).toBeVisible({ timeout: 60_000 });

    const drill = page.getByRole('button', { name: /Trigger emergency evacuation drill/i });
    await expect(drill).toBeVisible({ timeout: 25_000 });
    await drill.focus();
    await expect(drill).toBeFocused();
    await drill.click();
    await expect(page.getByText(/Emergency detected/i)).toBeVisible({ timeout: 15_000 });
  });
});
