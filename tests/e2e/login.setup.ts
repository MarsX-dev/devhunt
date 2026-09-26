import { test } from '@playwright/test';
import fs from 'node:fs';
import { AUTH_STATE } from '../../playwright.config';

// Run with `pnpm test:login`: a browser opens, you sign in with Google/GitHub yourself,
// and the session is saved to tests/e2e/.auth/user.json (git-ignored) for the logged-in tests.
test('save a logged-in session', async ({ page }) => {
  test.setTimeout(5 * 60_000);
  await page.goto('/login');
  await page.waitForURL(url => !url.pathname.startsWith('/login') && !url.hostname.includes('google') && !url.hostname.includes('github'), {
    timeout: 5 * 60_000,
  });
  await page.goto('/account/details');
  await page.getByText('Edit profile').first().waitFor({ state: 'attached', timeout: 60_000 });
  fs.mkdirSync('tests/e2e/.auth', { recursive: true });
  await page.context().storageState({ path: AUTH_STATE });
});
