import { test, expect } from '@playwright/test';

/**
 * Scenario: staff updates routingPolicy/live via callable; UI at /staff.
 * Shell: staff routes require auth; wrong role would hit /unauthorized after sign-in (see RoleRoute tests).
 */
test.describe('staff policy update — auth gate', () => {
  test('/staff redirects to login when signed out', async ({ page }) => {
    await page.goto('/staff');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });

  test('command dashboards redirect to login when signed out', async ({ page }) => {
    await page.goto('/command/aero');
    await expect(page).toHaveURL(/\/login/, { timeout: 90_000 });
  });
});
