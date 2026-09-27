import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { testEnv } from '../env';

// Deleting a tool: only with its name typed, a restorable snapshot is kept, and the page is gone.
// The account deletion dialog is checked without confirming (the test account must stay).
// Opt-in with QA_WRITE_TESTS=1; the test tool and its snapshot are cleaned up.
test.skip(!process.env.QA_WRITE_TESTS, 'Set QA_WRITE_TESTS=1 to run write tests');

const serviceDb = () => createClient(testEnv('NEXT_PUBLIC_SUPABASE_URL')!, testEnv('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
let toolId: number | undefined;

test.afterAll(async () => {
  if (!toolId) return;
  await serviceDb().from('deleted_records').delete().eq('kind', 'product').eq('record_id', String(toolId));
  await serviceDb().from('products').update({ deleted: true, deleted_at: new Date().toISOString() }).eq('id', toolId);
});

test('a tool is deleted only after typing its name, with a snapshot kept', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const name = `QA Delete Me ${Date.now()}${testInfo.project.name.length}`;
  const res = await page.request.post('/api/tools', {
    data: {
      name,
      slogan: 'Open-source CLI to test REST and GraphQL APIs',
      website: 'https://example.com/',
      description: 'A command-line tool for developers to write, run and share REST and GraphQL API tests in CI. (Internal DevHunt QA test, removed automatically.)',
      pricingType: 1,
      logoUrl: 'https://mars-images.imgix.net/1790424424410-1790424423031qa-logo.png?auto=compress&fit=max&w=128',
      assetUrls: ['https://mars-images.imgix.net/1790424426140-1790424425553qa.png?auto=compress&fit=max&w=750'],
    },
  });
  expect(res.status()).toBe(200);
  const { product } = await res.json();
  toolId = product.id;

  // The API refuses without the exact name.
  const wrong = await page.request.post(`/api/tools/${product.id}/delete`, { data: { confirm: 'QA Delete' } });
  expect(wrong.status()).toBe(400);

  await page.goto('/account/tools');
  const row = page.locator('li', { hasText: name });
  await row.getByRole('button', { name: 'Delete tool' }).click();
  const dialog = page.getByRole('alertdialog');
  const confirm = dialog.getByRole('button', { name: 'Delete tool' });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel('Confirmation').fill('qa delete');
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel('Confirmation').fill(name.toLowerCase());
  await confirm.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('li', { hasText: name })).toHaveCount(0);

  const db = serviceDb();
  const { data: row2 } = await db.from('products').select('deleted, deleted_at').eq('id', product.id).single();
  expect(row2).toMatchObject({ deleted: true });
  const { data: snaps } = await db.from('deleted_records').select('kind, owner_id, data').eq('record_id', String(product.id));
  expect(snaps?.length).toBe(1);
  expect((snaps![0] as any).data.product.name).toBe(name);

  // Deleting again (or someone else's tool) is a plain 404.
  expect((await page.request.post(`/api/tools/${product.id}/delete`, { data: { confirm: name } })).status()).toBe(404);
  expect((await page.request.post('/api/tools/33467882/delete', { data: { confirm: 'Knecht Works' } })).status()).toBe(404);
});

test('the account deletion dialog needs the username and the API refuses anything else', async ({ page }) => {
  // Wrong confirmation: refused before anything is touched.
  expect((await page.request.post('/api/account/delete', { data: { confirm: 'definitely-not-my-username' } })).status()).toBe(400);
  await page.goto('/account/details');
  await page.getByRole('button', { name: 'Delete account' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText("can’t sign in or sign up again");
  await expect(dialog.getByRole('button', { name: 'Delete my account' })).toBeDisabled();
  await dialog.getByLabel('Confirmation').fill('someone-else');
  await expect(dialog.getByRole('button', { name: 'Delete my account' })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toHaveCount(0);
});
