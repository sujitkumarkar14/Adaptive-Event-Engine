import { test, expect } from '@playwright/test';

/**
 * Semantic alignment: real-time coordination — staff command routes and policy surface.
 */
test.describe('real-time coordination (shell)', () => {
  test('staff dashboard requires authentication', async ({ page }) => {
    await page.goto('/staff');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });

  test('aero command view requires authentication', async ({ page }) => {
    await page.goto('/command/aero');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
