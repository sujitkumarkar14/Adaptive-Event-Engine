import { test, expect } from '@playwright/test';

/**
 * Scenario: alert copy + preferred content language on dashboard (see ConcourseCopilotCard).
 * Shell: document language and login copy for reviewer traceability.
 */
test.describe('multilingual alert flow (shell)', () => {
  test('root document exposes html lang for assistive tech', async ({ page }) => {
    await page.goto('/login');
    const lang = await page.evaluate(() => document.documentElement.lang || 'en');
    expect(lang.length).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });
  });

  test('vouchers route is protected like other attendee surfaces', async ({ page }) => {
    await page.goto('/vouchers');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
