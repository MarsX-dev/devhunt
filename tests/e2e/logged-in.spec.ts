import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, trackErrors } from './helpers';

// Read-only checks with the saved session (see login.setup.ts). Nothing here creates or changes data.

test('My tools loads quickly', async ({ page }) => {
  const started = Date.now();
  await page.goto('/account/tools');
  await expect(page.getByText(/No launches found|Edit your tool/).first()).toBeVisible();
  expect(Date.now() - started).toBeLessThan(10_000);
});

test('submit form leaves the launch date for the next step', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/account/tools/new');
  await expect(page.getByText(/pick your launch date on the next step/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit and pick a launch date' })).toBeVisible();
  await expect(page.locator('select[name=week]')).toHaveCount(0);
  await expect(page.getByText(/\$49/)).toHaveCount(0);
  await expectNoHorizontalScroll(page);
  expect(errors).toEqual([]);
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

  for (const body of [{ isPaid: true }, { launch_start: '2026-10-06T00:00:00Z' }, { votes_count: 9999 }]) {
    expect((await patch(body)).status, JSON.stringify(body)).toBe(403);
  }
  // Normal content edits still work.
  const ok = await patch({ slogan: own[0].slogan });
  expect(ok.status).toBe(200);
  // Direct inserts are refused (tools are created through /api/tools).
  const insert = await fetch(`${result.base}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'x', slug: `qa-direct-insert-${Date.now()}`, owner_id: result.userId, isPaid: true }),
  });
  expect(insert.status).toBe(403);
});
