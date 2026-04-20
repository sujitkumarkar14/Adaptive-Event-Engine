import { test, expect } from '@playwright/test';

/**
 * Semantic alignment: crowd movement & reroute — wayfinding and command surfaces are protected.
 */
test.describe('crowd movement — reroute (shell)', () => {
  test('wayfinding dashboard is not reachable without sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });

  test('traffic command matrix requires staff auth', async ({ page }) => {
    await page.goto('/command/traffic');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
