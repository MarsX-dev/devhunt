import { describe, expect, it } from 'vitest';
import { get } from './helpers';

// Pages whose browser JavaScript we inspect (covers the layout, forms and account pages).
const PAGES = ['/', '/tool/knecht-works', '/login', '/account/tools/new', '/account/tools', '/account/details', '/upcoming'];

// Things that must never ship to browsers.
const SECRET_PATTERNS: Array<[string, RegExp]> = [
  ['Discord webhook URL', /discord(app)?\.com\/api\/webhooks\/\d+\/[\w-]+/],
  ['Resend API key', /\bre_[A-Za-z0-9]{8}_[A-Za-z0-9]{16,}/],
  ['Stripe secret key', /\b(sk|rk)_(live|test)_[A-Za-z0-9]{10,}/],
  ['Stripe webhook secret', /\bwhsec_[A-Za-z0-9]{10,}/],
  ['Supabase service-role JWT', /eyJ[\w-]+\.eyJ[\w-]*cm9sZSI6InNlcnZpY2Vfcm9sZS[\w-]*\.[\w-]+/],
  ['welcome-email webhook', /ventryweather\.com/],
  ['mailer auth header', /mars-authorization/],
];

async function collectClientScripts(): Promise<string> {
  const chunkPaths = new Set<string>();
  for (const page of PAGES) {
    const html = await (await get(page)).text();
    for (const m of html.matchAll(/static\/chunks\/[\w./[\]%-]+\.js/g)) chunkPaths.add(m[0]);
  }
  const bodies = await Promise.all(Array.from(chunkPaths, async path => (await get(`/_next/${path}`)).text()));
  return bodies.join('\n');
}

describe('public JavaScript bundles', () => {
  it('contain no secrets', async () => {
    const js = await collectClientScripts();
    expect(js.length).toBeGreaterThan(100_000); // sanity: we actually fetched the bundles
    const leaks = SECRET_PATTERNS.filter(([, re]) => re.test(js)).map(([name]) => name);
    expect(leaks).toEqual([]);
  });
});
