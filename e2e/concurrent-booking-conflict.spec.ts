import { test, expect } from '@playwright/test';

/**
 * Concurrent booking attempts without auth: all clients hit the same gate.
 * Server-side capacity enforcement is covered in `functions/src/__tests__/booking-capacity-logic.test.ts`
 * and Spanner transactions in `reserveEntrySlot` (requires authenticated callable).
 */
test.describe('concurrent booking conflict (shell)', () => {
  test('parallel booking entry points converge on same gate', async ({ browser }) => {
    const c1 = await browser.newContext();
    const c2 = await browser.newContext();
    const p1 = await c1.newPage();
    const p2 = await c2.newPage();
    await Promise.all([p1.goto('/booking'), p2.goto('/booking')]);
    await expect(p1).toHaveURL(/\/login/);
    await expect(p2).toHaveURL(/\/login/);
    const h1 = await p1.getByRole('heading', { name: /Identity Gate/i }).textContent();
    const h2 = await p2.getByRole('heading', { name: /Identity Gate/i }).textContent();
    expect(h1).toBe(h2);
    await c1.close();
    await c2.close();
  });
});
