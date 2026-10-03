import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { testEnv } from '../env';

// Rich launch page: owner approves/hides findings; only approved ones are public. Findings are
// inserted directly (no AI credits). Opt-in with QA_WRITE_TESTS=1; everything is cleaned up.
test.skip(!process.env.QA_WRITE_TESTS, 'Set QA_WRITE_TESTS=1 to run write tests');

const serviceDb = () => createClient(testEnv('NEXT_PUBLIC_SUPABASE_URL')!, testEnv('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
let toolId: number | undefined;

test.afterAll(async () => {
  if (!toolId) return;
  await serviceDb().from('tool_enrichments').delete().eq('product_id', toolId);
  await serviceDb().from('products').update({ deleted: true, deleted_at: new Date().toISOString(), isPaid: false }).eq('id', toolId);
});

test('owner approves findings; only approved ones show on the tool page', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const res = await page.request.post('/api/tools', {
    data: {
      name: `QA Rich Page ${Date.now()}${testInfo.project.name.length}`,
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
  await db.from('products').update({ isPaid: true, enriched_at: new Date().toISOString() }).eq('id', product.id);
  await db.from('tool_enrichments').insert([
    { product_id: product.id, kind: 'award', title: '#1 Product of the Day', url: 'https://www.producthunt.com/products/x', source: 'Product Hunt' },
    { product_id: product.id, kind: 'review', title: 'This tool saved our team hours every single week.', body: 'Ana', url: 'https://example.org/review', source: 'example.org' },
    { product_id: product.id, kind: 'mention', title: 'Show HN: QA tool', url: 'https://news.ycombinator.com/item?id=1', source: 'Hacker News' },
  ]);

  // Visitors can't read pending findings.
  const anonKey = testEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')!;
  const anon = await page.request.get(`${testEnv('NEXT_PUBLIC_SUPABASE_URL')}/rest/v1/tool_enrichments?product_id=eq.${product.id}&select=id`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  expect(await anon.json()).toEqual([]);

  await page.goto(`/account/tools/highlights/${product.id}`);
  const row = (text: RegExp) => page.locator('li', { hasText: text });
  await expect(row(/#1 Product of the Day/)).toBeVisible();
  await row(/#1 Product of the Day/).getByRole('button', { name: 'Show' }).click();
  await row(/saved our team hours/).getByRole('button', { name: 'Show' }).click();
  await row(/Show HN: QA tool/).getByRole('button', { name: 'Hide' }).click();
  await expect(row(/#1 Product of the Day/).getByRole('button', { name: 'Show' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await db.from('tool_enrichments').select('status').eq('product_id', product.id).eq('status', 'approved')).data?.length).toBe(2);
  await page.screenshot({ path: testInfo.outputPath('owner-review.png'), fullPage: true });

  await page.goto(`/tool/${product.slug}`);
  await expect(page.getByRole('list', { name: 'Awards' }).getByText('#1 Product of the Day')).toBeVisible();
  await expect(page.getByText('This tool saved our team hours every single week.')).toBeVisible();
  await expect(page.getByText('Show HN: QA tool')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('tool-page.png'), fullPage: true });
});
