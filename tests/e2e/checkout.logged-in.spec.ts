import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { testEnv } from '../env';

// Full paid-launch flow against real Stripe Checkout, paid with a 100%-off promotion code ($0).
// Opt-in: runs only with QA_PROMO_CODE set, because it creates (and then soft-deletes) a real tool.
// QA_PROMO_CODE is the promotion code *id* (promo_...) of a single-use 100%-off code.
const PROMO = process.env.QA_PROMO_CODE;
// QA_WEBHOOK_ONLY=1: activation must come from the Stripe webhook alone (deployed site only).
const WEBHOOK_ONLY = !!process.env.QA_WEBHOOK_ONLY;
test.skip(!PROMO, 'Set QA_PROMO_CODE to run the payment flow');

const serviceDb = () => createClient(testEnv('NEXT_PUBLIC_SUPABASE_URL')!, testEnv('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

// The Tuesday two weeks from now (UTC), so the paid week is always upcoming.
function paidWeekKey() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + ((2 - d.getUTCDay() + 7) % 7 || 7) + 7);
  return d.toISOString().slice(0, 10);
}

// Minimal Stripe API client for the test (uses STRIPE_SECRET_KEY from .env.local).
async function stripe(path: string, form?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}${form ? '' : '?expand[]=line_items'}`, {
    method: form ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${testEnv('STRIPE_SECRET_KEY')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Stripe ${path}: ${body.error?.message}`);
  return body;
}

let createdId: number | undefined;
test.afterAll(async () => {
  if (createdId) await serviceDb().from('products').update({ deleted: true, deleted_at: new Date().toISOString(), isPaid: false }).eq('id', createdId);
});

test('pay for a launch with Stripe Checkout and see it activated', async ({ page }) => {
  test.setTimeout(180_000);
  const week = paidWeekKey();
  const res = await page.request.post('/api/tools', {
    data: {
      name: `QA Paid Launch ${Date.now()}`,
      slogan: 'Internal QA test - please ignore',
      website: 'https://example.com/',
      description: 'Internal QA test tool, please ignore.',
      pricingType: 1,
      logoUrl: 'https://mars-images.imgix.net/1790424424410-1790424423031qa-logo.png?auto=compress&fit=max&w=128',
      assetUrls: ['https://mars-images.imgix.net/1790424426140-1790424425553qa.png?auto=compress&fit=max&w=750'],
      week,
      submitType: 'paid',
    },
  });
  expect(res.status()).toBe(200);
  const { product, paid } = await res.json();
  createdId = product.id;
  expect(paid).toBe(true);

  // Not paid yet: the tool sits in the free queue, far from the chosen week.
  const before = (await serviceDb().from('products').select('isPaid, launch_start').eq('id', product.id).single()).data!;
  expect(before.isPaid).toBe(false);

  // 1) Our checkout route: the payment page opens a real Stripe Checkout for this tool and week.
  await page.goto(`/account/tools/activate-launch/${product.slug}?week=${week}`);
  await page.getByRole('button', { name: /^Pay \$49/ }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  const appSessionId = page.url().match(/cs_live_[A-Za-z0-9]+/)![0];
  const appSession = await stripe(`checkout/sessions/${appSessionId}`);
  expect(appSession.metadata).toMatchObject({ product_id: String(product.id), week_start: `${week}T00:00:00.000Z` });
  expect(appSession.amount_total).toBe(4900);

  // 2) Pay $0: same session data with the 100%-off promotion code pre-applied (Stripe blocks
  //    automated typing into its promo field), completed on Stripe's real hosted page.
  const paySession = await stripe('checkout/sessions', {
    mode: 'payment',
    'line_items[0][price]': appSession.line_items?.data?.[0]?.price?.id ?? 'price_1UK2y3BpCLVWiyCv71OgBqJa',
    'line_items[0][quantity]': '1',
    'discounts[0][promotion_code]': PROMO!,
    'adaptive_pricing[enabled]': 'false',
    customer_email: appSession.customer_email,
    // Webhook-only mode: land on the home page so the confirm route never runs.
    success_url: WEBHOOK_ONLY ? new URL('/?qa=webhook', appSession.success_url).toString() : appSession.success_url,
    cancel_url: appSession.cancel_url,
    ...Object.fromEntries(Object.entries(appSession.metadata).map(([k, v]) => [`metadata[${k}]`, String(v)])),
  });
  expect(paySession.amount_total).toBe(0);
  await stripe(`checkout/sessions/${appSessionId}/expire`, {});
  await page.goto(paySession.url);
  const agentBox = page.getByLabel(/I am an AI agent acting on behalf of someone else/i);
  if (await agentBox.isVisible().catch(() => false)) await agentBox.check();
  await page.getByRole('button', { name: /^Complete order/ }).click();

  // 3) Stripe sends the buyer back; our confirm route verifies with Stripe and activates.
  if (WEBHOOK_ONLY) {
    await page.waitForURL(/\?qa=webhook/, { timeout: 90_000 });
    await expect
      .poll(async () => (await serviceDb().from('products').select('isPaid').eq('id', product.id).single()).data?.isPaid, { timeout: 60_000 })
      .toBe(true);
  } else {
    await page.waitForURL(/activate-launch\/.*session_id=cs_live_/, { timeout: 90_000 });
    await expect(page.getByText('Launch activated!')).toBeVisible({ timeout: 30_000 });
  }

  const after = (await serviceDb().from('products').select('isPaid, launch_start, week').eq('id', product.id).single()).data!;
  expect(after.isPaid).toBe(true);
  expect(new Date(after.launch_start).toISOString().slice(0, 10)).toBe(week);
  const { data: payments } = await serviceDb().from('payments').select('amount_total, payment_status').eq('product_id', product.id);
  expect(payments).toHaveLength(1);
  expect(payments![0].amount_total).toBe(0);
  expect(['paid', 'no_payment_required']).toContain(payments![0].payment_status);

  // Visiting the success URL again (or a webhook retry) must not create a second payment row.
  if (!WEBHOOK_ONLY) {
    await page.reload();
    await expect(page.getByText('Launch activated!')).toBeVisible({ timeout: 30_000 });
  }
  expect((await serviceDb().from('payments').select('id').eq('product_id', product.id)).data).toHaveLength(1);
});
