import type Stripe from 'stripe';
import { AD_PRODUCTS, AUDIENCE, LIVE_STATUSES, REFUND_DAYS, isRecurring, planPrice, type AdKind, type AdPlan } from '@/utils/ads';
import { type EmailSponsorAdConfig } from '@/utils/email-templates/email-sponsor-ad';
import { groqJson } from '@/utils/server/enrich';
import { jevAsk } from '@/utils/server/jev';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { stripe } from '@/utils/server/stripe';
import { rehostImage, scrapeWithFirecrawl } from '@/utils/server/toolImport';
import { splitTitle, tagline as cutTagline, type ScrapedPage } from '@/utils/toolImport';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const AD_NAME_MAX = 24;
export const AD_TAGLINE_MAX = 70;
export const AD_DESCRIPTION_MAX = 220; // newsletter body

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
async function writeCopy(page: ScrapedPage): Promise<{ name: string; tagline: string; description: string }> {
  const fallback = {
    name: splitTitle(page.siteName || page.title).name.slice(0, AD_NAME_MAX),
    tagline: cutTagline(page.description || page.title, AD_TAGLINE_MAX),
    description: cutTagline(page.description || page.title, AD_DESCRIPTION_MAX),
  };
  if (!process.env.GROQ_API_KEY) return fallback;
  try {
    const out = (await groqJson(
      `You write tiny sponsor ads shown to software developers. Return JSON {"name": string, "tagline": string, "description": string}. name: the product's brand name exactly as the page uses it (max ${AD_NAME_MAX} chars). tagline: one punchy benefit-led line of at most 60 characters, concrete, no hype words, no emojis, no trailing period. description: 1-2 plain sentences for a newsletter sponsor slot (max ${AD_DESCRIPTION_MAX} chars) saying what it does and for whom. Use only facts stated on the page; never invent products or features.`,
      [`URL: ${page.url}`, `Title: ${page.title ?? ''}`, `Description: ${page.description ?? ''}`, `Page:\n${(page.markdown ?? '').slice(0, 5000)}`].join('\n'),
      400,
    )) as { name?: string; tagline?: string; description?: string } | null;
    const name = String(out?.name ?? '').trim().slice(0, AD_NAME_MAX);
    const raw = String(out?.tagline ?? '').trim().replace(/\.$/, '');
    // Too long: cut at a word boundary rather than mid-word.
    const tagline = raw.length <= AD_TAGLINE_MAX ? raw : raw.slice(0, AD_TAGLINE_MAX + 1).replace(/\s+\S*$/, '').replace(/[,;:\-–—\s]+$/, '');
    const description = String(out?.description ?? '').trim().slice(0, AD_DESCRIPTION_MAX);
    return { name: name || fallback.name, tagline: tagline || fallback.tagline, description: description || fallback.description };
  } catch (err) {
    console.error('ad copy failed:', (err as Error).message);
    return fallback;
  }
}

// URL -> draft ad (scrape, write copy, rehost logo, JEV check). The row is saved either way, so blocked
// attempts stay reviewable.
// URL -> one draft ad per chosen type, sharing the copy (scrape, write copy, rehost images, JEV check).
// Rows are saved either way, so blocked attempts stay reviewable.
export async function draftAds(userId: string, url: string, kinds: AdKind[]) {
  const page = await scrapeWithFirecrawl(url);
  const copy = await writeCopy(page);
  const host = new URL(page.url).hostname;
  const [logo, image, moderation] = await Promise.all([
    rehostImage(page.favicon || `https://www.google.com/s2/favicons?domain=${host}&sz=128`, 'w=128').catch(() => null),
    kinds.includes('newsletter') && page.ogImage ? rehostImage(page.ogImage, 'w=600').catch(() => null) : Promise.resolve(null),
    moderateAd({ url: page.url, ...copy, about: `${page.description ?? ''}\n${page.markdown ?? ''}` }),
  ]);
  const status = moderation.ok ? 'draft' : 'blocked';
  const { data, error } = await serviceClient
    .from('ad_slots' as any)
    .insert(kinds.map(kind => ({ user_id: userId, kind, url: page.url, ...copy, logo_url: logo, image_url: image, status, moderation })))
    .select('id, kind, url, name, tagline, description, logo_url, image_url, status');
  if (error) throw new Error(error.message);
  return { ads: (data ?? []) as any[], moderation };
}

export async function liveSlots(kind: AdKind): Promise<number[]> {
  const { data } = await serviceClient.from('ad_slots' as any).select('slot').eq('kind', kind).in('status', LIVE_STATUSES as any);
  return ((data ?? []) as any[]).map(r => r.slot as number);
}
export async function freeSlot(kind: AdKind): Promise<number | null> {
  const taken = new Set(await liveSlots(kind));
  for (let s = 1; s <= AD_PRODUCTS[kind].slots; s++) if (!taken.has(s)) return s;
  return null;
}
// Free slots per product, for the advertise pages.
export async function availability(): Promise<Record<AdKind, number>> {
  const { data } = await serviceClient.from('ad_slots' as any).select('kind').in('status', LIVE_STATUSES as any);
  const used = ((data ?? []) as any[]).reduce<Record<string, number>>((m, r) => ({ ...m, [r.kind]: (m[r.kind] ?? 0) + 1 }), {});
  return Object.fromEntries(Object.values(AD_PRODUCTS).map(p => [p.kind, Math.max(0, p.slots - (used[p.kind] ?? 0))])) as Record<AdKind, number>;
}

// One checkout for everything picked. Monthly ads become one subscription (one item each); a single
// newsletter edition is a one-time item on the first invoice, or a plain payment when bought alone.
export async function createAdCheckout(ads: { id: number; kind: AdKind; plan: AdPlan; name: string }[], user: { id: string; email?: string | null }, origin: string) {
  const meta = { kind: 'ad', ad_ids: ads.map(a => a.id).join(','), products: ads.map(a => `${a.kind}:${a.plan}`).join(','), user_id: user.id };
  const recurring = ads.some(a => isRecurring(a.kind, a.plan));
  return stripe().checkout.sessions.create({
    mode: recurring ? 'subscription' : 'payment',
    line_items: ads.map(ad => ({
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: planPrice(ad.kind, ad.plan) * 100,
        ...(isRecurring(ad.kind, ad.plan) ? { recurring: { interval: 'month' as const } } : {}),
        product_data: {
          name: isRecurring(ad.kind, ad.plan)
            ? `DevHunt ${AD_PRODUCTS[ad.kind].title.toLowerCase()}${AD_PRODUCTS[ad.kind].per ? ` (${AD_PRODUCTS[ad.kind].per} a month)` : ''}: ${ad.name}`
            : `DevHunt ${AD_PRODUCTS[ad.kind].title.toLowerCase()}, 1 edition: ${ad.name}`,
        },
      },
    })),
    allow_promotion_codes: true,
    adaptive_pricing: { enabled: false },
    customer_email: user.email ?? undefined,
    client_reference_id: `ads_${meta.ad_ids}`,
    metadata: meta,
    ...(recurring ? { subscription_data: { metadata: meta } } : { invoice_creation: { enabled: true }, payment_intent_data: { metadata: meta } }),
    success_url: `${origin}/account/advertise?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/account/advertise?canceled=1`,
  });
}

const periodEnd = (sub: Stripe.Subscription) => {
  const end = sub.items?.data?.[0]?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
};

const adIds = (meta?: Stripe.Metadata | null) =>
  String(meta?.ad_ids ?? meta?.ad_id ?? '')
    .split(',')
    .map(Number)
    .filter(Boolean);

// Paid checkout -> each ad goes live in the first free slot of its type. Idempotent (webhook + success page).
export async function activateAd(session: Stripe.Checkout.Session, source: 'webhook' | 'confirm') {
  const ids = adIds(session.metadata);
  if (session.metadata?.kind !== 'ad' || !ids.length || session.status !== 'complete') return { status: 'not-paid' as const };
  const { data } = await serviceClient.from('ad_slots' as any).select('*').in('id', ids);
  const rows = (data ?? []) as any[];
  if (!rows.length) return { status: 'invalid' as const };

  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  const sub = subId ? await stripe().subscriptions.retrieve(subId) : null;
  const email = session.customer_details?.email;
  let activated = 0;
  let noSlot = 0;
  for (const row of rows) {
    if (row.status === 'active' || row.status === 'canceling') continue;
    let done = false;
    // Two buyers can race for the last slot; the unique index decides, and the loser is flagged.
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      const slot = await freeSlot(row.kind);
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
          current_period_end: sub && row.plan !== 'single' ? periodEnd(sub) : null,
          editions_left: row.plan === 'single' ? 1 : null,
        })
        .eq('id', row.id);
      if (!error) {
        done = true;
        activated++;
        await logPaymentEvent({ event: 'ad_activated', stripeSessionId: session.id, userId: row.user_id, details: { ad_id: row.id, kind: row.kind, slot, source } });
        await notifyAdDiscord(`💸 **New sponsor** ${AD_PRODUCTS[row.kind as AdKind].title} ${row.plan === 'single' ? `$${planPrice(row.kind, 'single')} single edition` : `$${planPrice(row.kind)}/mo`}: [${row.name}](${row.url}) in slot ${slot}${email ? ` by ${email}` : ''}`);
      }
    }
    if (!done) {
      noSlot++;
      await logPaymentEvent({ event: 'ad_no_slot', level: 'error', stripeSessionId: session.id, userId: row.user_id, details: { ad_id: row.id, kind: row.kind } });
      await notifyAdDiscord(`⚠️ **Sponsor paid but the ${row.kind} slots are taken**: [${row.name}](${row.url}), session ${session.id}. Refund that item or add a slot.`);
    }
  }
  if (noSlot) return { status: 'no-slot' as const };
  return { status: activated ? ('activated' as const) : ('already-active' as const) };
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
    .eq('plan', 'monthly') // a single edition bought alongside runs until it's sent (see newsletterSent)
    .in('status', ['active', 'canceling'])
    .select('name, slot, kind');
  if (data?.length && status === 'ended') {
    await notifyAdDiscord(`🔚 Sponsor ended: ${(data as any[]).map(r => `${r.name} (${r.kind} slot ${r.slot})`).join(', ')}; slots are free again`);
  }
}

// "Cancel and refund": within REFUND_DAYS of the latest charge, refunds it and ends the subscription
// (every ad in it) now. Returns null when the latest payment is too old (a normal cancel still works).
export async function refundSubscription(subscriptionId: string, label: string) {
  const { data: invoices } = await stripe().invoices.list({ subscription: subscriptionId, status: 'paid', limit: 1 });
  const invoice = invoices[0];
  if (!invoice || Date.now() - invoice.created * 1000 > REFUND_DAYS * 86400_000) return null;
  let refunded = 0;
  if (invoice.amount_paid > 0) {
    const { data: payments } = await stripe().invoicePayments.list({ invoice: invoice.id!, status: 'paid' });
    const intent = payments[0]?.payment?.payment_intent;
    const intentId = typeof intent === 'string' ? intent : intent?.id;
    if (!intentId) throw new Error('no payment to refund');
    const refund = await stripe().refunds.create({ payment_intent: intentId, metadata: { subscription: subscriptionId } });
    refunded = refund.amount;
  }
  const sub = await stripe().subscriptions.cancel(subscriptionId);
  // The refund covered everything on that invoice, including a single edition not sent yet.
  await serviceClient.from('ad_slots' as any).update({ refunded_at: new Date().toISOString() }).eq('stripe_subscription_id', subscriptionId);
  await serviceClient.from('ad_slots' as any).update({ status: 'ended', canceled_at: new Date().toISOString() }).eq('stripe_subscription_id', subscriptionId).eq('plan', 'single').in('status', LIVE_STATUSES as any);
  await syncAdSubscription(sub);
  await notifyAdDiscord(`↩️ Sponsor refunded $${(refunded / 100).toFixed(2)} and ended: ${label}`);
  return { refunded };
}

// A single edition bought on its own: refundable within REFUND_DAYS as long as it hasn't gone out.
export async function refundSingle(ad: { id: number; name: string; stripe_session_id: string; editions_left: number | null; started_at: string | null }) {
  if (!ad.editions_left || !ad.started_at || Date.now() - Date.parse(ad.started_at) > REFUND_DAYS * 86400_000) return null;
  const session = await stripe().checkout.sessions.retrieve(ad.stripe_session_id);
  const intentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!intentId) throw new Error('no payment to refund');
  const refund = await stripe().refunds.create({ payment_intent: intentId, metadata: { ad_id: String(ad.id) } });
  await serviceClient.from('ad_slots' as any).update({ status: 'ended', refunded_at: new Date().toISOString(), canceled_at: new Date().toISOString() }).eq('id', ad.id);
  await notifyAdDiscord(`↩️ Sponsor refunded $${(refund.amount / 100).toFixed(2)} (single newsletter edition, not sent): ${ad.name}`);
  return { refunded: refund.amount };
}

// The refund window for an ad's latest charge (for the "Cancel and refund" button).
export async function refundableUntil(subscriptionId: string): Promise<string | null> {
  const { data } = await stripe().invoices.list({ subscription: subscriptionId, status: 'paid', limit: 1 }).catch(() => ({ data: [] as Stripe.Invoice[] }));
  const until = data[0] ? data[0].created * 1000 + REFUND_DAYS * 86400_000 : 0;
  return until > Date.now() ? new Date(until).toISOString() : null;
}

// The paid newsletter ad, shaped for the weekly email's sponsor block (null: use the house ad).
export async function newsletterSponsor(): Promise<(EmailSponsorAdConfig & { adId: number }) | null> {
  const { data } = await serviceClient
    .from('ad_slots' as any)
    .select('id, name, tagline, description, url, logo_url, image_url')
    .eq('kind', 'newsletter')
    .in('status', LIVE_STATUSES as any)
    .order('slot')
    .limit(1)
    .maybeSingle();
  const ad = data as any;
  if (!ad) return null;
  // Through the click counter, marked as an email click.
  const link = `https://devhunt.org/api/ads/click/${ad.id}?src=email`;
  return {
    adId: ad.id,
    bannerImageUrl: ad.image_url || ad.logo_url || '',
    bannerLinkUrl: link,
    title: `${ad.name}: ${ad.tagline}`,
    description: ad.description || ad.tagline,
    ctaLinkUrl: link,
    ctaText: 'Learn More ›',
  };
}

// After the weekly email went out: a single-edition ad has run and ends.
export async function newsletterSent(adId: number) {
  // Each edition's recipients count as impressions in the advertiser's stats.
  await serviceClient.rpc('track_ad_newsletter' as never, { _id: adId, _recipients: AUDIENCE.newsletterSubscribers } as never);
  const { data } = await serviceClient.from('ad_slots' as any).select('plan, editions_left, name').eq('id', adId).single();
  const ad = data as any;
  if (!ad || ad.plan !== 'single') return;
  const left = Math.max(0, (ad.editions_left ?? 1) - 1);
  await serviceClient.from('ad_slots' as any).update({ editions_left: left, ...(left === 0 ? { status: 'ended' } : {}) }).eq('id', adId);
  if (left === 0) await notifyAdDiscord(`📬 Single newsletter edition sent for ${ad.name}; the newsletter slot is free again`);
}

export async function notifyAdDiscord(content: string) {
  const webhook = process.env.DISCORD_PAYMENTS_WEBHOOK;
  if (!webhook) return;
  await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }).catch(err =>
    console.error(`[ads] discord notify failed: ${(err as Error).message}`),
  );
}
