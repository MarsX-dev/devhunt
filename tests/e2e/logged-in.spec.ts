import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalScroll, trackErrors } from './helpers';

// Read-only checks with the saved session (see login.setup.ts). Nothing here creates or changes data.

test('My tools loads quickly', async ({ page }) => {
  const started = Date.now();
  await page.goto('/account/tools');
  await expect(page.getByText(/No launches found|Edit your tool/).first()).toBeVisible();
  expect(Date.now() - started).toBeLessThan(10_000);
});

test('submit starts with just the website, then the form; the launch date comes after', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/account/tools/new');
  await expect(page.getByRole('heading', { name: 'What are you launching?' })).toBeVisible();
  await expect(page.getByLabel("Your tool's website")).toBeVisible();
  await expect(page.getByPlaceholder('My Awesome Dev Tool')).toHaveCount(0);
  await page.getByRole('button', { name: 'Fill it in manually' }).click();
  await expect(page.getByRole('button', { name: 'Submit and pick a launch date' })).toBeVisible();
  await expect(page.locator('select[name=week]')).toHaveCount(0);
  await expect(page.getByText(/\$49(?!\d)/)).toHaveCount(0); // the $49 launch price, not the $499/mo sponsor strip
  await expectNoHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test('vote state for all cards on the home page comes from one or two requests', async ({ page }) => {
  const voteLookups: string[] = [];
  page.on('request', req => {
    if (req.url().includes('/rest/v1/product_votes')) voteLookups.push(req.url());
  });
  await page.goto('/');
  await expect(page.locator('#more-launches li').nth(5)).toBeVisible();
  await page.waitForTimeout(2_000);
  expect(voteLookups.length).toBeGreaterThan(0);
  expect(voteLookups.length).toBeLessThanOrEqual(2);
});

test('edit profile page shows the saved profile', async ({ page }) => {
  await page.goto('/account/details');
  await expect(page.getByRole('button', { name: 'save' })).toBeVisible();
});

test('owners cannot mark tools paid, move launches, change counters or insert tools directly', async ({ page }) => {
  await page.goto('/account/tools');
  const result = await page.evaluate(async () => {
    const raw = document.cookie.split('; ').find(c => c.includes('-auth-token='))!;
    const [access] = JSON.parse(decodeURIComponent(raw.split('=').slice(1).join('=')));
    const payload = JSON.parse(atob(access.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const base = `${payload.iss.replace('/auth/v1', '')}/rest/v1`;
    const apikey = (window as any).__NEXT_DATA__?.props?.anonKey; // not exposed; fall back to fetching it below
    return { base, access, userId: payload.sub, apikey };
  });
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (await import('../env')).testEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')!;
  const headers = { apikey: anon, Authorization: `Bearer ${result.access}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  // One of the test account's own tools (any, deleted or not).
  const own = await (await fetch(`${result.base}/products?owner_id=eq.${result.userId}&select=id,slogan&limit=1`, { headers })).json();
  expect(own.length).toBe(1);
  const id = own[0].id;
  const patch = (body: object) => fetch(`${result.base}/products?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });

  // Deleting/restoring goes through /api/tools/[id]/delete (snapshot first), never a direct update.
  for (const body of [{ isPaid: true }, { launch_start: '2026-10-06T00:00:00Z' }, { votes_count: 9999 }]) {
    expect((await patch(body)).status, JSON.stringify(body)).toBe(403);
  }
  // Un-deleting one of the account's deleted tools directly is refused too.
  const [gone] = await (await fetch(`${result.base}/products?owner_id=eq.${result.userId}&deleted=eq.true&select=id&limit=1`, { headers })).json();
  const undelete = await fetch(`${result.base}/products?id=eq.${gone.id}`, { method: 'PATCH', headers, body: JSON.stringify({ deleted: false }) });
  expect(undelete.status).toBe(403);
  // Users can't mark their own profile deleted (that bans the account, server-side only).
  const profilePatch = await fetch(`${result.base}/profiles?id=eq.${result.userId}`, { method: 'PATCH', headers, body: JSON.stringify({ deleted_at: new Date().toISOString() }) });
  expect(profilePatch.status).toBe(403);
  // Content edits too: they go through PATCH /api/tools/[id] (validated and re-moderated), never straight to the table.
  expect((await patch({ slogan: own[0].slogan })).status).toBe(403);
  const viaApi = await page.evaluate(async toolId => (await fetch(`/api/tools/${toolId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, id);
  expect([400, 404]).toContain(viaApi); // signed in: reaches the route (empty edit refused, or a deleted tool)
  // Direct inserts are refused (tools are created through /api/tools).
  const insert = await fetch(`${result.base}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'x', slug: `qa-direct-insert-${Date.now()}`, owner_id: result.userId, isPaid: true }),
  });
  expect(insert.status).toBe(403);
});

test('"Start with your website" fills in the whole form (Firecrawl/JEV mocked)', async ({ page }) => {
  const errors = trackErrors(page);
  const logo = 'https://mars-images.imgix.net/1790424424410-1790424423031qa-logo.png?auto=compress&fit=max&w=128';
  const shot = 'https://mars-images.imgix.net/1790424426140-1790424425553qa.png?auto=compress&fit=max&w=750';
  await page.route('**/api/tools/import', route =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { enabled: true, ai: true } })
      : route.fulfill({
          json: {
            draft: {
              name: 'FooBar',
              slogan: 'Trace and monitor your LLM apps.',
              description: 'FooBar is an open-source observability platform for LLM apps.',
              website: 'https://foobar.dev/',
              pricingTypeId: 2,
              categoryIds: [10],
              logoUrl: logo,
              screenshotUrls: [shot],
            },
            categories: [{ id: 10, name: 'AI' }],
          },
        }),
  );
  await page.goto('/account/tools/new');
  await page.getByLabel("Your tool's website").fill('foobar.dev');
  await page.getByRole('button', { name: 'Continue →' }).click();
  await expect(page.getByText(/filled in from foobar\.dev/)).toBeVisible();
  await expect(page.getByPlaceholder('My Awesome Dev Tool')).toHaveValue('FooBar');
  await expect(page.getByPlaceholder('Supercharge Your Development Workflow!')).toHaveValue('Trace and monitor your LLM apps.');
  await expect(page.getByPlaceholder('https://myawesomedevtool.com/')).toHaveValue('https://foobar.dev/');
  await expect(page.getByPlaceholder(/Briefly explain/)).toHaveValue(/open-source observability/);
  await expect(page.getByRole('radio', { name: 'Subscription' })).toBeChecked();
  await expect(page.locator('form').getByText('AI', { exact: true })).toBeVisible();
  await expect(page.locator(`form img[src="${logo}"]`)).toBeVisible();
  await expect(page.locator(`form img[src="${shot}"]`)).toBeVisible();
  expect(errors).toEqual([]);
});

// The navbar has two avatar buttons (phone and desktop layouts); only one is visible at a time.
const openProfileMenu = async (page: Page) => page.locator('nav button:has(img)').filter({ visible: true }).first().click();

test('makers who paid get "Download invoice" in the profile menu', async ({ page }) => {
  // Pretend the account has a paid tool (the test account has none).
  await page.route(/\/rest\/v1\/products\?select=id&owner_id=eq\.[^&]+&isPaid=eq\.true/, route => route.fulfill({ json: [{ id: 1 }] }));
  await page.goto('/the-story');
  await openProfileMenu(page);
  const invoice = page.getByRole('link', { name: /Download invoice/ });
  await expect(invoice).toBeVisible();
  await expect(invoice).toHaveAttribute('href', 'https://zenvoice.io/p/65d6370232047df47b4c142b');
  await expect(invoice).toHaveAttribute('target', '_blank');
});

test('people who never paid see no invoice link', async ({ page }) => {
  await page.goto('/the-story');
  await openProfileMenu(page);
  await expect(page.getByRole('link', { name: 'My tools' }).first()).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('link', { name: /Download invoice/ })).toHaveCount(0);
});
