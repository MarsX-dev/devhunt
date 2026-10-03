import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { testEnv } from '../env';

// Funnel tracking records each submit step with who, where and what was entered. Automated browsers
// are normally not tracked, so this test opts in with a normal user agent and a window flag.
// Opt-in with QA_WRITE_TESTS=1; its events are deleted afterwards.
test.skip(!process.env.QA_WRITE_TESTS, 'Set QA_WRITE_TESTS=1 to run write tests');
test.use({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' });

const serviceDb = () => createClient(testEnv('NEXT_PUBLIC_SUPABASE_URL')!, testEnv('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
let visitor: string | undefined;

test.afterAll(async () => {
  if (visitor) await serviceDb().from('funnel_events').delete().eq('visitor_id', visitor);
});

test('submit steps are recorded with the user, country, device and form data', async ({ page, context }) => {
  await page.addInitScript(() => ((window as any).__DH_TRACK_IN_TESTS = true));
  await page.route('**/api/tools/import', route =>
    route.request().method() === 'GET' ? route.fulfill({ json: { enabled: true } }) : route.fulfill({ status: 502, json: { error: 'QA: site unreachable' } }),
  );
  await page.goto('/account/tools/new?utm_source=qa-test');
  await page.getByLabel("Your tool's website").fill('qa-funnel-test.dev');
  await page.getByRole('button', { name: 'Continue →' }).click();
  await expect(page.getByPlaceholder('https://myawesomedevtool.com/')).toHaveValue('https://qa-funnel-test.dev');

  visitor = (await context.cookies()).find(c => c.name === 'dh_vid')?.value;
  expect(visitor).toBeTruthy();
  // Server-only steps can't be sent from the browser.
  await page.request.post('/api/funnel', { data: JSON.stringify({ step: 'paid', vid: visitor, props: { amount: 999 } }) });

  const db = serviceDb();
  await expect
    .poll(async () => ((await db.from('funnel_events').select('step').eq('visitor_id', visitor!)).data ?? []).map(r => r.step).sort(), { timeout: 15_000 })
    .toEqual(['import_done', 'submit_view', 'url_entered']);
  const { data: rows } = await db.from('funnel_events').select('step, user_id, country, device, utm, props').eq('visitor_id', visitor!);
  const byStep = Object.fromEntries((rows ?? []).map(r => [r.step, r]));
  expect(byStep.url_entered.props).toMatchObject({ url: 'qa-funnel-test.dev', path: '/account/tools/new' });
  expect(byStep.import_done.props).toMatchObject({ ok: false, error: 'QA: site unreachable' });
  expect(byStep.submit_view.user_id).toBeTruthy();
  expect(byStep.submit_view.device).toBe('desktop');
  expect(byStep.submit_view.country).toBe('XX'); // no geo header locally
  expect(byStep.submit_view.utm).toEqual({ utm_source: 'qa-test' });
});
