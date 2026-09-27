import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { testEnv } from '../env';

// Submission moderation with the real JEV API: banned topics are blocked and hidden; non-dev tools
// can only buy a listing in "Other". Opt-in (QA_REAL_AI=1): posts two QA messages to Discord.
test.skip(!process.env.QA_REAL_AI, 'Set QA_REAL_AI=1 to run moderation against the real JEV API');
test.describe.configure({ mode: 'serial' });

const serviceDb = () => createClient(testEnv('NEXT_PUBLIC_SUPABASE_URL')!, testEnv('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const created: number[] = [];
test.afterAll(async () => {
  for (const id of created) await serviceDb().from('products').update({ deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
});

const submit = (page: any, name: string, slogan: string, description: string, website: string) =>
  page.request.post('/api/tools', {
    data: {
      name: `${name} ${Date.now()}`,
      slogan,
      website,
      description: `${description} (Internal DevHunt QA test, removed automatically.)`,
      pricingType: 1,
      logoUrl: 'https://mars-images.imgix.net/1790424424410-1790424423031qa-logo.png?auto=compress&fit=max&w=128',
      assetUrls: ['https://mars-images.imgix.net/1790424426140-1790424425553qa.png?auto=compress&fit=max&w=750'],
    },
  });

test('gambling submission is blocked, hidden and held for review', async ({ page }) => {
  const res = await submit(page, 'QA Casino Bonus Finder', 'Find the best online casino bonuses and free spins', 'Compare online casinos, sports betting sites and slot bonuses to win real money.', 'https://example.com/');
  const body = await res.json();
  created.push(body.product.id);
  expect(body.moderation).toBe('blocked');
  const { data } = await serviceDb().from('products').select('deleted, moderation, moderation_reason').eq('id', body.product.id).single();
  expect(data).toMatchObject({ deleted: true, moderation: 'blocked', moderation_reason: 'gambling' });
  await page.goto(`/account/tools/activate-launch/${body.product.slug}?held=${body.moderationReason}`);
  await expect(page.getByText("We're taking a closer look")).toBeVisible();
  expect((await page.request.get(`/tool/${body.product.slug}`)).status()).toBe(404);
});

test('non-dev submission is kept out of the competition and offered an Other listing', async ({ page }) => {
  const res = await submit(page, 'QA Wedding Planner', 'Plan your dream wedding with checklists and vendors', 'A wedding planning app for couples: guest lists, budgets, venues, florists and photographers in one place.', 'https://example.com/');
  const body = await res.json();
  created.push(body.product.id);
  expect(body.moderation).toBe('not_a_fit');
  const { data } = await serviceDb().from('products').select('deleted, moderation, product_categories(name)').eq('id', body.product.id).single();
  expect(data).toMatchObject({ deleted: false, moderation: 'not_a_fit', product_categories: [{ name: 'Other' }] });
  await page.goto(`/account/tools/activate-launch/${body.product.slug}?new=1`);
  await expect(page.getByRole('heading', { name: 'Not quite a dev tool' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Get listed for $49' })).toBeVisible();
  await expect(page.getByText('Free launch')).toHaveCount(0);
});
