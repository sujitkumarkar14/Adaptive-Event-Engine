import { test, expect } from '@playwright/test';

/**
 * Stress-style shell: multiple browser contexts hit staff/wayfinding routes concurrently.
 * Full multi-user Firestore + live pressure requires authenticated staging; here we prove
 * consistent auth gating under parallel load.
 */
test.describe('high congestion — parallel protected routes', () => {
  test('multiple sessions converge on login when unauthenticated', async ({ browser }) => {
    const c1 = await browser.newContext();
    const c2 = await browser.newContext();
    const c3 = await browser.newContext();
    const p1 = await c1.newPage();
    const p2 = await c2.newPage();
    const p3 = await c3.newPage();

    await Promise.all([p1.goto('/dashboard'), p2.goto('/staff'), p3.goto('/command/gates')]);

    await Promise.all([
      expect(p1).toHaveURL(/\/login/, { timeout: 90_000 }),
      expect(p2).toHaveURL(/\/login/, { timeout: 90_000 }),
      expect(p3).toHaveURL(/\/login/, { timeout: 90_000 }),
    ]);

    await c1.close();
    await c2.close();
    await c3.close();
  });

  test('rapid route switches stay behind Identity Gate', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
      await page.goto('/booking');
      await expect(page).toHaveURL(/\/login/);
      await page.goto('/staff');
      await expect(page).toHaveURL(/\/login/);
    }
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible();
  });
});
