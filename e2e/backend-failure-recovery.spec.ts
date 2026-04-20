import { test, expect } from '@playwright/test';

/**
 * Simulates transient network/API failure in the page context; the login shell should remain coherent.
 * Deeper Firebase/HTTP retry behavior is covered in `functions/src/__tests__/retry-logic.test.ts`.
 */
test.describe('backend failure recovery (simulated)', () => {
  test('login heading remains after fetch is forced to reject', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible({ timeout: 90_000 });

    await page.evaluate(() => {
      const orig = window.fetch.bind(window);
      window.fetch = () => Promise.reject(new Error('simulated_backend_failure'));
      (window as unknown as { __restoreFetch?: () => void }).__restoreFetch = () => {
        window.fetch = orig;
      };
    });

    await expect(page.getByRole('heading', { name: /Identity Gate/i })).toBeVisible();

    await page.evaluate(() => {
      (window as unknown as { __restoreFetch?: () => void }).__restoreFetch?.();
    });
  });
});
