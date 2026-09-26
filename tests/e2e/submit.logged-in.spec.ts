import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { testEnv } from '../env';

// Submits a tool through the real form (free queue). Opt-in with QA_WRITE_TESTS=1: it uploads
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

test('submit a tool through the form into the free queue', async ({ page }) => {
  test.setTimeout(120_000);
  const name = `QA Form Tool ${Date.now()}`;
  await page.goto('/account/tools/new');
  await page.locator('input[name=logo-upload]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png('8/w8AAgMBAb') });
  await page.locator('input[name=file-upload]').setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: png('8/w8AAgMBAb') });
  await page.getByPlaceholder('My Awesome Dev Tool').fill(name);
  await page.getByPlaceholder('Supercharge Your Development Workflow!').fill('Internal QA test - please ignore');
  await page.getByPlaceholder('https://myawesomedevtool.com/').fill('https://example.com/');
  await page.getByPlaceholder(/Briefly explain what your tool does/).fill('Internal QA test tool, please ignore.');
  await page.getByRole('radio', { name: 'Free' }).check();
  await expect(page.locator('form img').nth(1)).toBeVisible({ timeout: 30_000 }); // uploads finished

  // Pick the first (full) week, then take the free queue.
  const first = await page.locator('select[name=week] option').nth(1).getAttribute('value');
  await page.locator('select[name=week]').selectOption(first!);
  await page.getByRole('button', { name: /Or wait for the free queue/ }).click();

  await page.waitForURL(/\/tool\/qa-form-tool-\d+\?banner=true/, { timeout: 60_000 });
  createdSlug = new URL(page.url()).pathname.split('/').pop();

  const { data } = await serviceDb().from('products').select('isPaid, paid_launch_date, launch_start, week').eq('slug', createdSlug!).single();
  expect(data!.isPaid).toBe(false);
  expect(data!.paid_launch_date).toBeNull();
  // Free queue: a future week with capacity, never the full first week.
  expect(new Date(data!.launch_start).getTime()).toBeGreaterThan(Date.now());
  expect(new Date(data!.launch_start).toISOString().slice(0, 10)).not.toBe(first);
});
