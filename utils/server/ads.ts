import type Stripe from 'stripe';
import { AD_PRICE_USD, AD_SLOTS, LIVE_STATUSES } from '@/utils/ads';
import { groqJson } from '@/utils/server/enrich';
import { jevAsk } from '@/utils/server/jev';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { stripe } from '@/utils/server/stripe';
import { rehostImage, scrapeWithFirecrawl } from '@/utils/server/toolImport';
import { splitTitle, tagline as cutTagline, type ScrapedPage } from '@/utils/toolImport';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const AD_NAME_MAX = 24;
export const AD_TAGLINE_MAX = 70;

// Ads we don't run. Same banned topics as tool submissions, plus a "fine" option JEV can pick.
const AD_TOPIC_QUESTION = {
  type: 'choice',
  instructions: 'A company wants to buy a sponsor ad on DevHunt, a site for developer tools. Classify what the advertised product is mainly about.',
  criteria: {
    ok: 'A normal legitimate product or business of any kind (software, SaaS, services, agencies, education, developer tooling for blockchains, payments or security)',
    crypto: 'Cryptocurrency trading, tokens, coins, NFT or airdrop promotion, crypto investing or yield schemes',
    gambling: 'Gambling, betting, casinos, lotteries or sweepstakes',
    adult: 'Adult or sexual content, dating for sex, NSFW generators',
    fraud: 'Scams, fake reviews or followers, spam, phishing, account or document selling, get-rich-quick, deceptive or illegal products',
  },
};
const BLOCK_PROBABILITY = 0.6;

export type AdModeration = { ok: boolean; topic: string | null; probability: number | null; jev: boolean };

export async function moderateAd(ad: { url: string; name: string; tagline: string; about?: string }): Promise<AdModeration> {
  const state = [`Website: ${ad.url}`, `Name: ${ad.name}`, `Ad headline: ${ad.tagline}`, `About: ${(ad.about ?? '').slice(0, 2000)}`].join('\n');
  const answers = await jevAsk(state, { topic: AD_TOPIC_QUESTION }, 10000);
  if (!answers) return { ok: true, topic: null, probability: null, jev: false }; // JEV down: allow, it's flagged in Discord
  const topic = typeof answers.topic?.choice === 'string' ? (answers.topic.choice as string) : null;
  const probability = topic ? Number(answers.topic?.probabilities?.[topic] ?? answers.topic?.confidence) : NaN;
  const p = Number.isFinite(probability) ? probability : null;
  return { ok: !topic || topic === 'ok' || (p ?? 0) < BLOCK_PROBABILITY, topic, probability: p, jev: true };
}

// Name + headline for the ad, written by the LLM from the scraped page (falls back to the page title).
async function writeCopy(page: ScrapedPage): Promise<{ name: string; tagline: string }> {
  const fallback = { name: splitTitle(page.siteName || page.title).name.slice(0, AD_NAME_MAX), tagline: cutTagline(page.description || page.title, AD_TAGLINE_MAX) };
  if (!process.env.GROQ_API_KEY) return fallback;
  try {
    const out = (await groqJson(
      `You write tiny sponsor ads shown to software developers. Return JSON {"name": string, "tagline": string}. name: the product's brand name exactly as the page uses it (max ${AD_NAME_MAX} chars). tagline: one punchy benefit-led line of at most 60 characters, concrete, no hype words, no emojis, no trailing period. Use only facts stated on the page; never invent products or features.`,
      [`URL: ${page.url}`, `Title: ${page.title ?? ''}`, `Description: ${page.description ?? ''}`, `Page:\n${(page.markdown ?? '').slice(0, 5000)}`].join('\n'),
      400,
    )) as { name?: string; tagline?: string } | null;
    const name = String(out?.name ?? '').trim().slice(0, AD_NAME_MAX);
    const raw = String(out?.tagline ?? '').trim().replace(/\.$/, '');
    // Too long: cut at a word boundary rather than mid-word.
    const tagline = raw.length <= AD_TAGLINE_MAX ? raw : raw.slice(0, AD_TAGLINE_MAX + 1).replace(/\s+\S*$/, '').replace(/[,;:\-–—\s]+$/, '');
    return { name: name || fallback.name, tagline: tagline || fallback.tagline };
  } catch (err) {
    console.error('ad copy failed:', (err as Error).message);
    return fallback;
  }
}

// URL -> draft ad (scrape, write copy, rehost logo, JEV check). The row is saved either way, so blocked
// attempts stay reviewable.
export async function draftAd(userId: string, url: string) {
  const page = await scrapeWithFirecrawl(url);
  const copy = await writeCopy(page);
  const host = new URL(page.url).hostname;
  const [logo, moderation] = await Promise.all([
    rehostImage(page.favicon || `https://www.google.com/s2/favicons?domain=${host}&sz=128`, 'w=128').catch(() => null),
    moderateAd({ url: page.url, ...copy, about: `${page.description ?? ''}\n${page.markdown ?? ''}` }),
  ]);
  const { data, error } = await serviceClient
    .from('ad_slots' as any)
    .insert({ user_id: userId, url: page.url, name: copy.name, tagline: copy.tagline, logo_url: logo, status: moderation.ok ? 'draft' : 'blocked', moderation })
    .select('id, url, name, tagline, logo_url, status')
    .single();
  if (error) throw new Error(error.message);
  return { ad: data as any, moderation };
}

export async function liveSlots(): Promise<number[]> {
  const { data } = await serviceClient.from('ad_slots' as any).select('slot').in('status', LIVE_STATUSES as any);
  return ((data ?? []) as any[]).map(r => r.slot as number);
}
export async function freeSlot(): Promise<number | null> {
  const taken = new Set(await liveSlots());
  for (let s = 1; s <= AD_SLOTS; s++) if (!taken.has(s)) return s;
  return null;
}

export async function createAdCheckout(ad: { id: number; name: string; url: string }, user: { id: string; email?: string | null }, origin: string) {
  return stripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: AD_PRICE_USD * 100,
          recurring: { interval: 'month' },
          product_data: { name: `DevHunt sponsor slot: ${ad.name}` },
        },
      },
    ],
    allow_promotion_codes: true,
    adaptive_pricing: { enabled: false },
    customer_email: user.email ?? undefined,
    client_reference_id: `ad_${ad.id}`,
    metadata: { kind: 'ad', ad_id: String(ad.id), user_id: user.id },
    subscription_data: { metadata: { kind: 'ad', ad_id: String(ad.id), user_id: user.id } },
    success_url: `${origin}/account/advertise?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/account/advertise?canceled=1`,
  });
}

const periodEnd = (sub: Stripe.Subscription) => {
  const end = sub.items?.data?.[0]?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
};

// Paid checkout -> the ad goes live in the first free slot. Idempotent (webhook + success page).
export async function activateAd(session: Stripe.Checkout.Session, source: 'webhook' | 'confirm') {
  const adId = Number(session.metadata?.ad_id);
  if (session.metadata?.kind !== 'ad' || !adId || session.status !== 'complete') return { status: 'not-paid' as const };
  const { data: ad } = await serviceClient.from('ad_slots' as any).select('*').eq('id', adId).single();
  if (!ad) return { status: 'invalid' as const };
  const row = ad as any;
  if (row.status === 'active' || row.status === 'canceling') return { status: 'already-active' as const, ad: row };

  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  const sub = subId ? await stripe().subscriptions.retrieve(subId) : null;
  // Two buyers can race for the last slot; the unique index decides, and the loser is flagged.
  for (let attempt = 0; attempt < 3; attempt++) {
    const slot = await freeSlot();
    if (!slot) break;
    const { error } = await serviceClient
      .from('ad_slots' as any)
      .update({
        slot,
        status: 'active',
        started_at: new Date().toISOString(),
        stripe_session_id: session.id,
        stripe_subscription_id: subId ?? null,
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
        current_period_end: sub ? periodEnd(sub) : null,
      })
      .eq('id', adId);
    if (!error) {
      await logPaymentEvent({ event: 'ad_activated', stripeSessionId: session.id, userId: row.user_id, amountTotal: session.amount_total, currency: session.currency, details: { ad_id: adId, slot, source } });
      await notifyAdDiscord(`💸 **New sponsor** $${AD_PRICE_USD}/mo: [${row.name}](${row.url}) in slot ${slot}${session.customer_details?.email ? ` by ${session.customer_details.email}` : ''}`);
      return { status: 'activated' as const, ad: { ...row, slot, status: 'active' } };
    }
  }
  await logPaymentEvent({ event: 'ad_no_slot', level: 'error', stripeSessionId: session.id, userId: row.user_id, details: { ad_id: adId } });
  await notifyAdDiscord(`⚠️ **Sponsor paid but all slots are taken**: [${row.name}](${row.url}), session ${session.id}. Refund or add a slot.`);
  return { status: 'no-slot' as const };
}

// Keeps the row in step with Stripe (renewal, cancel at period end, resume, ended).
export async function syncAdSubscription(sub: Stripe.Subscription) {
  if (sub.metadata?.kind !== 'ad') return;
  const ended = sub.status === 'canceled' || sub.status === 'incomplete_expired' || sub.status === 'unpaid';
  const status = ended ? 'ended' : sub.cancel_at_period_end || sub.cancel_at ? 'canceling' : 'active';
  const { data } = await serviceClient
    .from('ad_slots' as any)
    .update({ status, current_period_end: periodEnd(sub), ...(status !== 'active' ? { canceled_at: new Date().toISOString() } : { canceled_at: null }) })
    .eq('stripe_subscription_id', sub.id)
    .in('status', ['active', 'canceling'])
    .select('name, url, slot')
    .maybeSingle();
  if (data && status === 'ended') await notifyAdDiscord(`🔚 Sponsor ended: ${(data as any).name}, slot ${(data as any).slot} is free again`);
}

export async function notifyAdDiscord(content: string) {
  const webhook = process.env.DISCORD_PAYMENTS_WEBHOOK;
  if (!webhook) return;
  await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }).catch(err =>
    console.error(`[ads] discord notify failed: ${(err as Error).message}`),
  );
}
