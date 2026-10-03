import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { testEnv } from '../env';

// Owners edit their tool's fact sheet; tools with a dead/hijacked website are hidden (404) from
// everyone but the owner. Opt-in with QA_WRITE_TESTS=1; everything is cleaned up.
test.skip(!process.env.QA_WRITE_TESTS, 'Set QA_WRITE_TESTS=1 to run write tests');

const serviceDb = () => createClient(testEnv('NEXT_PUBLIC_SUPABASE_URL')!, testEnv('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
let toolId: number | undefined;

test.afterAll(async () => {
  if (!toolId) return;
  await serviceDb().from('tool_profiles').delete().eq('product_id', toolId);
  await serviceDb().from('products').update({ deleted: true, deleted_at: new Date().toISOString(), site_status: 'ok', site_status_reason: null }).eq('id', toolId);
});

const PROFILE = {
  summary: 'QA Profile Tool runs API tests from the command line.',
  audience: 'Backend developers',
  best_for: 'API tests in CI',
  features: [
    { title: 'CLI runner', description: 'Runs REST and GraphQL tests from the terminal.' },
    { title: 'CI reports', description: 'Posts results to pull requests.' },
  ],
  use_cases: ['Run API tests on every pull request.'],
  integrations: ['GitHub Actions'],
  pricing: { model: 'free', free_trial: null, plans: [] },
  faq: [{ q: 'Is it free?', a: 'Yes, the CLI is free and open source.' }],
  alternatives: [],
  github: null,
};

test('owner edits the fact sheet; a hijacked website hides the tool from everyone else', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const res = await page.request.post('/api/tools', {
    data: {
      name: `QA Profile Tool ${Date.now()}${testInfo.project.name.length}`,
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
  const db = serviceDb();
  await db.from('tool_profiles').upsert({ product_id: product.id, status: 'ready', data: PROFILE, sources: ['https://example.com'], generated_at: new Date().toISOString() });

  // Hijacked website (before anyone opened the page): 404 for visitors, a notice for the owner.
  const hide = await db.from('products').update({ site_status: 'hijacked', site_status_reason: 'the domain now shows gambling content' }).eq('id', product.id);
  expect(hide.error).toBeNull();
  // A plain request without the owner's cookies = a signed-out visitor.
  const base = testInfo.project.use.baseURL ?? 'http://localhost:3124';
  expect((await fetch(`${base}/tool/${product.slug}`)).status).toBe(404);
  expect(await (await fetch(`${base}/sitemap.xml`)).text()).not.toContain(`/tool/${product.slug}<`);
  await page.goto(`/tool/${product.slug}`);
  await expect(page.getByRole('alert').filter({ hasText: 'Only you can see this page' })).toBeVisible();
  await page.goto('/account/tools');
  await expect(page.getByText('Hidden: website hijacked')).toBeVisible();
  await db.from('products').update({ site_status: 'ok', site_status_reason: null }).eq('id', product.id);

  // Edit: reword the summary and hide the FAQ.
  await page.goto(`/account/tools/profile/${product.id}`);
  const summary = page.getByPlaceholder('One sentence on what it does');
  await expect(summary).toHaveValue(PROFILE.summary);
  await summary.fill('QA Profile Tool: API tests from your terminal, edited by the maker.');
  await page.getByRole('heading', { name: 'FAQ', exact: true }).locator('..').getByLabel('show on my page').uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/^Saved\./)).toBeVisible();
  const { data: saved } = await db.from('tool_profiles').select('data').eq('product_id', product.id).single();
  expect((saved as any).data.summary).toBe('QA Profile Tool: API tests from your terminal, edited by the maker.');
  expect((saved as any).data.hidden).toEqual(['faq']);
  expect((saved as any).data.owner_edited_at).toBeTruthy();

  // Restored tools come back within a minute (the existence check is cached briefly).
  await expect
    .poll(async () => (await page.goto(`/tool/${product.slug}`))?.status(), { timeout: 90_000, intervals: [5_000] })
    .toBe(200);
  await expect(page.getByText('QA Profile Tool: API tests from your terminal, edited by the maker.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Key features' })).toBeVisible();
  await expect(page.locator('#faq')).toHaveCount(0);
});
