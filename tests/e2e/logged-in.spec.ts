import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { AUTH_STATE } from '../../playwright.config';
import { trackErrors } from './helpers';

test.skip(!fs.existsSync(AUTH_STATE), 'No saved session: run `pnpm test:login` once to enable logged-in tests.');

// Read-only checks with the saved session (see login.setup.ts). Nothing here creates or changes data.

test('My tools loads quickly', async ({ page }) => {
  const started = Date.now();
  await page.goto('/account/tools');
  await expect(page.getByText(/No launches found|Edit your tool/).first()).toBeVisible();
  expect(Date.now() - started).toBeLessThan(10_000);
});

test('submit form shows the next free week and the skip-the-line option', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/account/tools/new');
  await expect(page.getByText(/Skip the line: launch next week/)).toBeVisible();
  await expect(page.getByText(/Free launch queue: the next free week is/)).toBeVisible();

  // Every week option is keyed by its start date, and far-future weeks don't crash the form.
  const select = page.locator('select[name=week]');
  const values = await select.locator('option').evaluateAll(opts => opts.map(o => (o as HTMLOptionElement).value).filter(Boolean));
  expect(values.every(v => /^\d{4}-\d{2}-\d{2}$/.test(v))).toBe(true);
  await select.selectOption(values[values.length - 1]);
  await expect(page.locator('#submit-btn').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('edit profile page shows the saved profile', async ({ page }) => {
  await page.goto('/account/details');
  await expect(page.getByRole('button', { name: 'save' })).toBeVisible();
});
