import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { testEnv } from '../env';
import { expectNoHorizontalScroll, trackErrors } from './helpers';

// Submits a tool through the real form, then keeps the free launch date on the next step.
// Opt-in with QA_WRITE_TESTS=1: it uploads
// images and creates a tool, which is soft-deleted afterwards.
test.skip(!process.env.QA_WRITE_TESTS, 'Set QA_WRITE_TESTS=1 to run form submission tests');

const serviceDb = () => createClient(testEnv('NEXT_PUBLIC_SUPABASE_URL')!, testEnv('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const png = (color: string) =>
  // 1x1 PNG in the given grey level; enough for the uploader.
  Buffer.from(`iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN${color}AAAAABJRU5ErkJggg==`, 'base64');

let createdSlug: string | undefined;
test.afterAll(async () => {
  if (createdSlug) await serviceDb().from('products').update({ deleted: true, deleted_at: new Date().toISOString() }).eq('slug', createdSlug);
});

test('submit a tool, then keep the free launch date on the next step', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = trackErrors(page);
  const name = `QA Form Tool ${Date.now()}${Math.floor(Math.random() * 1000)}`;
  await page.goto('/account/tools/new');
  await expect(page.getByRole('heading', { name: 'What are you launching?' })).toBeVisible();
  await page.getByRole('button', { name: 'Fill it in manually' }).click();
  await page.locator('input[name=logo-upload]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png('8/w8AAgMBAb') });
  await page.locator('input[name=file-upload]').setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: png('8/w8AAgMBAb') });
  await page.getByPlaceholder('My Awesome Dev Tool').fill(name);
  await page.getByPlaceholder('Supercharge Your Development Workflow!').fill('Open-source CLI to test REST and GraphQL APIs');
  await page.getByPlaceholder('https://myawesomedevtool.com/').fill('https://example.com/');
  await page.getByPlaceholder(/Briefly explain what your tool does/).fill(
    'A command-line tool for developers to write, run and share REST and GraphQL API tests in CI. (Internal DevHunt QA test, removed automatically.)',
  );
  await page.getByRole('radio', { name: 'Free' }).check();
  await expect(page.locator('form img').nth(1)).toBeVisible({ timeout: 30_000 }); // uploads finished
  await page.getByRole('button', { name: 'Submit and pick a launch date' }).click();

  // Step 2: the tool already sits in the free queue; the owner picks free or a paid week.
  await page.waitForURL(/\/account\/tools\/activate-launch\/qa-form-tool-\d+\?new=1/, { timeout: 60_000 });
  createdSlug = new URL(page.url()).pathname.split('/').pop();
  await expect(page.getByText(`Launch plan · ${name}`)).toBeVisible();
  await expect(page.getByRole('heading', { name: /in front of .* developers/ })).toBeVisible();

  const { data } = await serviceDb().from('products').select('isPaid, paid_launch_date, launch_start').eq('slug', createdSlug!).single();
  expect(data!.isPaid).toBe(false);
  expect(data!.paid_launch_date).toBeNull();
  expect(new Date(data!.launch_start).getTime()).toBeGreaterThan(Date.now() + 28 * 864e5); // the free queue is beyond the paid weeks
  const freeDate = new Date(data!.launch_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const freeButton = page.getByRole('button', { name: `Launch for free on ${freeDate}` });
  await expect(freeButton).toBeVisible();

  // Paid option: exactly the next 4 weeks; the pay button follows the selected week.
  const weeks = page.getByRole('radio');
  await expect(weeks).toHaveCount(4);
  await expect(weeks.first()).toBeChecked();
  const third = await weeks.nth(2).getAttribute('value');
  await page.locator(`label:has(input[value="${third}"])`).click();
  await expect(weeks.nth(2)).toBeChecked();
  const thirdDate = new Date(`${third}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  await expect(page.getByRole('button', { name: `Launch on ${thirdDate} for $49` })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: testInfo.outputPath('launch-date.png'), fullPage: true });

  await freeButton.click();
  await page.waitForURL(new RegExp(`/tool/${createdSlug}\\?banner=true`), { timeout: 30_000 });
  expect(errors).toEqual([]);
});
