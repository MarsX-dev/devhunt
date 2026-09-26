import { describe, expect, it } from 'vitest';
import { get } from './helpers';

// Pages that must render for anonymous visitors.
const OK_PAGES = [
  '/',
  '/all-dev-tools',
  '/upcoming',
  '/tools/ai',
  '/tool/knecht-works',
  '/@JohnRush_87d11',
  '/blog',
  '/the-story',
  '/login',
  '/best-dev-tools-this-week-on-product-hunt',
  '/robots.txt',
];

// Unknown, deleted or dev-only URLs must be real 404s (not a 200 page that says "not found").
const NOT_FOUND = [
  '/does-not-exist-xyz',
  '/@nobody-zzz-123',
  '/tools/does-not-exist',
  '/tool/does-not-exist',
  '/tool/devhunt29',
  '/blog/does-not-exist-zzz',
  '/email-sponsor-ad',
  '/api/test',
  '/api/add-contact-quick',
  '/api/ph-dev-tools/get-website-url/https%3A%2F%2Fexample.com', // removed: fetched arbitrary URLs
  '/zentao/user-login.html',
];

describe('public pages', () => {
  it.each(OK_PAGES)('%s returns 200', async path => {
    expect((await get(path)).status).toBe(200);
  });

  it.each(NOT_FOUND)('%s returns 404', async path => {
    expect((await get(path)).status).toBe(404);
  });

  it('a deleted tool does not leak its name in the page title', async () => {
    const html = await (await get('/tool/devhunt29')).text();
    expect(html).not.toMatch(/<title>[^<]*devhunt29/i);
  });

  // These used to hit the profile route and time out after 15s. On Vercel, Next 13.5 serves the
  // not-found page for a POST with status 200 (locally it's 404), so check the page and the speed.
  it('bot POSTs to unknown paths get the not-found page fast', async () => {
    const started = Date.now();
    const res = await get('/zentao/user-login.html', { method: 'POST' });
    expect([200, 404]).toContain(res.status);
    expect(await res.text()).toContain('Page not found');
    expect(Date.now() - started).toBeLessThan(5_000);
  });
});

describe('protected endpoints reject anonymous callers', () => {
  it.each(['/api/upvote-notification', '/api/comment-notification', '/api/login', '/api/tools', '/api/tools/1/reschedule', '/api/checkout'])('POST %s -> 401', async path => {
    const res = await get(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(res.status).toBe(401);
  });

  it.each(['/api/top-3-winners-email', '/api/winners-personal-congrats-email', '/api/new-tools-launch-reminder-email'])(
    'GET %s -> 401 without the cron token',
    async path => {
      expect((await get(path)).status).toBe(401);
    },
  );

  it('/api/top-3-past-winners-email does nothing in production', async () => {
    const res = await get('/api/top-3-past-winners-email');
    const body = await res.text();
    expect(res.status === 401 || body.includes('Not allowed in production')).toBe(true);
  });

  it('GET /api/checkout/confirm -> 401 without a session', async () => {
    expect((await get('/api/checkout/confirm?session_id=cs_live_abc')).status).toBe(401);
  });

  it('Stripe webhook rejects missing and forged signatures', async () => {
    const payload = JSON.stringify({ id: 'evt_x', type: 'checkout.session.completed', data: { object: { id: 'cs_live_x' } } });
    const noSig = await get('/api/stripe/webhook', { method: 'POST', body: payload });
    expect(noSig.status).toBe(400);
    const forged = await get('/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}` },
      body: payload,
    });
    expect(forged.status).toBe(400);
  });

  it('/api/login ignores a forged name/email in the body', async () => {
    const res = await get('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'x', personalEMail: 'victim@example.com' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('sitemap.xml', () => {
  it('is complete, well-formed and uses the standard namespace', async () => {
    const res = await get('/sitemap.xml');
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml.trimStart().startsWith('<?xml')).toBe(true);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    // Supabase caps queries at 1,000 rows; the sitemap must page past that.
    expect((xml.match(/\/tool\//g) ?? []).length).toBeGreaterThan(5_000);
    expect(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/.test(xml)).toBe(false);
    expect(xml).not.toContain('/tool/devhunt29<');
  });
});
