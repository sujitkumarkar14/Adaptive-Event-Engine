import { test, expect } from '@playwright/test';

/**
 * Multiple isolated browser contexts hit the same protected routes (same "gate" / wayfinding intent).
 * Without shared Firestore sessions in CI, we assert consistent auth gating: every client sees the same
 * Identity Gate, not divergent or conflicting shell states.
 */
test.describe('multi-user state consistency (shell)', () => {
  test('parallel clients see the same login gate for dashboard', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    const pages = await Promise.all(contexts.map((c) => c.newPage()));

    await Promise.all(pages.map((p) => p.goto('/dashboard')));

    const headings = await Promise.all(
      pages.map((p) => p.getByRole('heading', { name: /Identity Gate/i }).textContent())
    );

    expect(new Set(headings).size).toBe(1);
    expect(headings[0]).toMatch(/Identity Gate/i);

    await Promise.all(contexts.map((c) => c.close()));
  });

  test('staff route consistency across parallel clients', async ({ browser }) => {
    const c1 = await browser.newContext();
    const c2 = await browser.newContext();
    const p1 = await c1.newPage();
    const p2 = await c2.newPage();
    await Promise.all([p1.goto('/staff'), p2.goto('/staff')]);
    await expect(p1).toHaveURL(/\/login/);
    await expect(p2).toHaveURL(/\/login/);
    const t1 = await p1.getByRole('heading', { name: /Identity Gate/i }).textContent();
    const t2 = await p2.getByRole('heading', { name: /Identity Gate/i }).textContent();
    expect(t1).toBe(t2);
    await c1.close();
    await c2.close();
  });
});
