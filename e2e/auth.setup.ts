import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as setup, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth', 'user.json');

/**
 * Persists storage for `chromium-authenticated` project.
 * With E2E_TEST_EMAIL / E2E_TEST_PASSWORD unset, saves an unauthenticated session (login page only).
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  await page.goto('/login');
  if (!email || !password) {
    await page.context().storageState({ path: authFile });
    return;
  }
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByLabel(/^Password$/i).fill(password);
  await page.getByRole('button', { name: /^Sign In$/i }).click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 60_000 });
  await page.context().storageState({ path: authFile });
});
