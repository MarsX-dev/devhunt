import type Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { AD_PRODUCTS, AUDIENCE, LIVE_STATUSES, REFUND_MS, WEEK_DAYS, isRecurring, planLabel, planPrice, type AdKind, type AdPlan } from '@/utils/ads';
import { type EmailSponsorAdConfig } from '@/utils/email-templates/email-sponsor-ad';
import { groqJson } from '@/utils/server/enrich';
import { jevAsk } from '@/utils/server/jev';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { trackFunnel } from '@/utils/server/funnel';
import { stripe } from '@/utils/server/stripe';
import { rehostImage, scrapeWithFirecrawl } from '@/utils/server/toolImport';
import { splitTitle, tagline as cutTagline, type ScrapedPage } from '@/utils/toolImport';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const AD_NAME_MAX = 24;
export const AD_TAGLINE_MAX = 70;
export const AD_DESCRIPTION_MAX = 220; // newsletter body

// Ads we don't run. Same banned topics as tool submissions, plus a "fine" option JEV can pick.
const AD_TOPICS = {
  ok: 'A normal legitimate product or business of any kind (software, SaaS, services, agencies, education, security, anti-fraud, anti-scam and anti-spam tools, developer tooling for blockchains, payments or security)',
  crypto: 'Cryptocurrency trading, tokens, coins, NFT or airdrop promotion, crypto investing or yield schemes',
  gambling: 'Gambling, betting, casinos, lotteries or sweepstakes',
  adult: 'Adult or sexual content, dating for sex, NSFW generators',
  fraud: 'Scams, fake reviews or followers, spam, phishing, account or document selling, get-rich-quick, deceptive or illegal products (tools that fight these are ok)',
};
// Two questions, both must pass: what the linked website is about, and what the ad text itself
// promotes. With the site as context JEV judges the site and misses a casino headline on a normal
// site; the ad text alone reads as spam too easily, so it's judged with the site as background.
const AD_SITE_QUESTION = {
  type: 'choice',
  instructions: 'A company wants to buy a sponsor ad on DevHunt, a site for developer tools. Classify what the advertised website and product are mainly about.',
  criteria: AD_TOPICS,
};
const AD_COPY_QUESTION = {
  type: 'choice',
  instructions:
    'A company wants to buy a sponsor ad on DevHunt, a site for developer tools. Classify what the AD TEXT (name, headline, description) itself promotes. The website text is background only: if the ad text promotes something different from the website, judge the ad text.',
  criteria: AD_TOPICS,
};
const BLOCK_PROBABILITY = 0.6;

export type AdModeration = { ok: boolean; topic: string | null; probability: number | null; jev: boolean; on?: 'site' | 'copy' };

// `website`: the linked page's text (title, description, content) when we have it.
export async function moderateAd(ad: { url: string; name: string; tagline: string; description?: string | null; website?: string | null }): Promise<AdModeration> {
  const state = [
    `Ad name: ${ad.name}`,
    `Ad headline: ${ad.tagline}`,
    `Ad description: ${ad.description ?? ''}`,
    `Links to: ${ad.url}`,
    `Website text: ${(ad.website ?? '').slice(0, 2000)}`,
  ].join('\n');
  const answers = await jevAsk(state, { site: AD_SITE_QUESTION, copy: AD_COPY_QUESTION }, 10000);
  if (!answers) return { ok: true, topic: null, probability: null, jev: false }; // JEV down: callers decide (flagged in Discord)
  const verdicts = (['copy', 'site'] as const).map(on => {
    const topic = typeof answers[on]?.choice === 'string' ? (answers[on].choice as string) : null;
    const probability = topic ? Number(answers[on]?.probabilities?.[topic] ?? answers[on]?.confidence) : NaN;
    const p = Number.isFinite(probability) ? probability : null;
    return { on, topic, probability: p, flagged: !!topic && topic !== 'ok' && (p ?? 0) >= BLOCK_PROBABILITY };
  });
  const bad = verdicts.find(v => v.flagged);
  const shown = bad ?? verdicts[1];
  return { ok: !bad, topic: shown.topic, probability: shown.probability, jev: true, on: shown.on };
}

// Re-check after the advertiser changes an ad (before paying, or while it's live). JEV always gets the
// linked page as context: short ad copy on its own reads as spam too easily, and a swapped-in website
// is judged on what it says, not just its address. A new link that can't be read is refused (topic
// 'unreadable'); an unchanged one is judged on the copy alone.
export async function moderateAdEdit(next: { url: string; name: string; tagline: string; description: string }, previousUrl: string): Promise<AdModeration> {
  let website: string | null = null;
  try {
    const page = await scrapeWithFirecrawl(next.url);
    website = [page.title, page.description, page.markdown].filter(Boolean).join('\n');
  } catch {
    if (next.url !== previousUrl) return { ok: false, topic: 'unreadable', probability: null, jev: false };
  }
  return moderateAd({ ...next, website });
}

const IMAGE_HOSTS = ['mars-images.imgix.net', 'marscode.s3.eu-north-1.amazonaws.com'];

// http(s) link with a real hostname, or null.
export function adUrl(raw: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    return ['http:', 'https:'].includes(u.protocol) && u.hostname.includes('.') ? u.toString() : null;
  } catch {
    return null;
  }
}

// The stored image, null (removed), or a new upload on our image host; false for anything else.
export function adImage(value: string | null, stored: string | null): string | null | false {
  if (!value) return null;
  if (value === stored) return stored;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && IMAGE_HOSTS.includes(u.hostname) ? value : false;
  } catch {
    return false;
  }
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
    moderateAd({ url: page.url, ...copy, website: [page.title, page.description, page.markdown].filter(Boolean).join('\n') }),
  ]);
  const status = moderation.ok ? 'draft' : 'blocked';
  const { data, error } = await serviceClient
    .from('ad_slots' as any)
    .insert(kinds.map(kind => ({ user_id: userId, kind, url: page.url, ...copy, logo_url: logo, image_url: image, status, moderation })))
    .select('id, kind, url, name, tagline, description, logo_url, image_url, status');
  if (error) throw new Error(error.message);
  return { ads: (data ?? []) as any[], moderation };
}

// The rails read /api/ads/slots from the CDN (60s) and /advertise shows spots left: refresh both as
// soon as an ad starts or stops, so a buyer sees their ad right away.
export function refreshAdPages() {
  try {
    revalidatePath('/api/ads/slots');
    revalidatePath('/advertise');
  } catch (err) {
    console.error('[ads] revalidate failed:', (err as Error).message);
  }
}

// Weekly sidebar/inline ads end 7 days after they start. Run before reading live slots (the reads are
// cached: the rails once a minute, the advertise pages on each visit of a buyer), so nothing polls for it.
export async function expireWeeklyAds() {
  const { data } = await serviceClient
    .from('ad_slots' as any)
    .update({ status: 'ended' })
    .eq('plan', 'weekly')
    .in('status', LIVE_STATUSES as any)
    .lt('current_period_end', new Date().toISOString())
    .select('name, slot, kind');
  if (!data?.length) return;
  refreshAdPages();
  await notifyAdDiscord(`🔚 Weekly sponsor ended: ${(data as any[]).map(r => `${r.name} (${r.kind} slot ${r.slot})`).join(', ')}; slots are free again`);
}

export async function liveSlots(kind: AdKind): Promise<number[]> {
  await expireWeeklyAds();
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
  await expireWeeklyAds();
  const { data } = await serviceClient.from('ad_slots' as any).select('kind').in('status', LIVE_STATUSES as any);
  const used = ((data ?? []) as any[]).reduce<Record<string, number>>((m, r) => ({ ...m, [r.kind]: (m[r.kind] ?? 0) + 1 }), {});
  return Object.fromEntries(Object.values(AD_PRODUCTS).map(p => [p.kind, Math.max(0, p.slots - (used[p.kind] ?? 0))])) as Record<AdKind, number>;
}

// One checkout for everything picked. Monthly ads become one subscription (one item each); weekly ads
// (a week of sidebar/inline, one newsletter edition) are one-time items on the first invoice, or a
// plain payment when nothing monthly is bought.
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
            : `DevHunt ${AD_PRODUCTS[ad.kind].title.toLowerCase()}, ${ad.plan === 'single' ? '1 edition' : '1 week'}: ${ad.name}`,
        },
      },
    })),
    allow_promotion_codes: true,
    adaptive_pricing: { enabled: false },
    customer_email: user.email ?? undefined,
    client_reference_id: `ads_${meta.ad_ids}`,
    metadata: meta,
    // A 100%-off code (how our own products book spots) must go through without a card: subscriptions
    // only ask for one when something is due, and payment mode gets no payment_intent_data (it would
    // force a card, see /api/checkout).
    ...(recurring ? { subscription_data: { metadata: meta }, payment_method_collection: 'if_required' as const } : { invoice_creation: { enabled: true } }),
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
  // Only for the renewal date: the ad goes live even if this lookup fails (the date then arrives with
  // the next customer.subscription.updated event).
  const sub = subId
    ? await stripe()
        .subscriptions.retrieve(subId)
        .catch(async err => {
          await logPaymentEvent({ event: 'ad_subscription_lookup_failed', level: 'warn', stripeSessionId: session.id, details: { message: (err as Error).message } });
          return null;
        })
    : null;
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
          current_period_end:
            row.plan === 'weekly' ? new Date(Date.now() + WEEK_DAYS * 86400_000).toISOString() : sub && row.plan === 'monthly' ? periodEnd(sub) : null,
          editions_left: row.plan === 'single' ? 1 : null,
        })
        .eq('id', row.id);
      if (!error) {
        done = true;
        activated++;
        await logPaymentEvent({ event: 'ad_activated', stripeSessionId: session.id, userId: row.user_id, details: { ad_id: row.id, kind: row.kind, slot, source } });
        await notifyAdDiscord(`💸 **New sponsor** ${AD_PRODUCTS[row.kind as AdKind].title} ${planLabel(row.kind, row.plan)}: [${row.name}](${row.url}) in slot ${slot}${email ? ` by ${email}` : ''}`);
      }
    }
    if (!done) {
      noSlot++;
      await logPaymentEvent({ event: 'ad_no_slot', level: 'error', stripeSessionId: session.id, userId: row.user_id, details: { ad_id: row.id, kind: row.kind } });
      await notifyAdDiscord(`⚠️ **Sponsor paid but the ${row.kind} slots are taken**: [${row.name}](${row.url}), session ${session.id}. Refund that item or add a slot.`);
    }
  }
  if (activated) {
    refreshAdPages();
    await trackFunnel({
      step: 'ad_paid',
      userId: rows[0].user_id,
      props: { amount: (session.amount_total ?? 0) / 100, kinds: rows.map(r => r.kind), name: rows[0].name, source },
    });
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
    .eq('plan', 'monthly') // weekly items bought alongside run their week / edition (expireWeeklyAds, newsletterSent)
    .in('status', ['active', 'canceling'])
    .select('name, slot, kind');
  if (data?.length) refreshAdPages();
  if (data?.length && status === 'ended') {
    await notifyAdDiscord(`🔚 Sponsor ended: ${(data as any[]).map(r => `${r.name} (${r.kind} slot ${r.slot})`).join(', ')}; slots are free again`);
  }
}

// Refunds a payment minus the processing fee Stripe charged on it (Stripe keeps that fee on refunds,
// so a full refund would cost us the fee). The fee is in our balance currency; converted back to the
// charge currency with the transaction's exchange rate.
async function refundMinusFee(intentId: string, metadata: Record<string, string>) {
  const intent = await stripe().paymentIntents.retrieve(intentId, { expand: ['latest_charge.balance_transaction'] });
  const charge = intent.latest_charge as Stripe.Charge | null;
  const tx = charge?.balance_transaction as Stripe.BalanceTransaction | null | undefined;
  if (!charge || !tx || typeof tx === 'string') throw new Error('payment has no balance transaction yet');
  const fee = Math.ceil(tx.fee / (tx.exchange_rate ?? 1));
  const amount = charge.amount - charge.amount_refunded - fee;
  if (amount <= 0) return { refunded: 0 };
  const refund = await stripe().refunds.create({ payment_intent: intentId, amount, metadata: { ...metadata, fee_kept: String(fee) } });
  return { refunded: refund.amount };
}

// "Cancel and refund": within REFUND_HOURS of the latest charge, refunds it and ends the subscription
// (every ad in it) now. Returns null when the latest payment is too old (a normal cancel still works).
export async function refundSubscription(subscriptionId: string, label: string) {
  const { data: invoices } = await stripe().invoices.list({ subscription: subscriptionId, status: 'paid', limit: 1 });
  const invoice = invoices[0];
  if (!invoice || Date.now() - invoice.created * 1000 > REFUND_MS) return null;
  let refunded = 0;
  if (invoice.amount_paid > 0) {
    const { data: payments } = await stripe().invoicePayments.list({ invoice: invoice.id!, status: 'paid' });
    const intent = payments[0]?.payment?.payment_intent;
    const intentId = typeof intent === 'string' ? intent : intent?.id;
    if (!intentId) throw new Error('no payment to refund');
    refunded = (await refundMinusFee(intentId, { subscription: subscriptionId })).refunded;
  }
  const sub = await stripe().subscriptions.cancel(subscriptionId);
  // The refund covered everything on that invoice, including weekly items bought with it.
  await serviceClient.from('ad_slots' as any).update({ refunded_at: new Date().toISOString() }).eq('stripe_subscription_id', subscriptionId);
  await serviceClient.from('ad_slots' as any).update({ status: 'ended', canceled_at: new Date().toISOString() }).eq('stripe_subscription_id', subscriptionId).in('plan', ['single', 'weekly']).in('status', LIVE_STATUSES as any);
  await syncAdSubscription(sub);
  await notifyAdDiscord(`↩️ Sponsor refunded $${(refunded / 100).toFixed(2)} and ended: ${label}`);
  return { refunded };
}

// Weekly ads bought without a subscription (one payment, maybe several ads): refundable within
// REFUND_HOURS of the payment (not once a newsletter edition in it was sent). The refund covers the
// whole payment, so every ad in it ends.
export async function refundOneTime(ad: { id: number; name: string; status: string; stripe_session_id: string; started_at: string | null }) {
  if (!(LIVE_STATUSES as readonly string[]).includes(ad.status) || !ad.started_at || Date.now() - Date.parse(ad.started_at) > REFUND_MS) return null;
  // A newsletter edition that has gone out can't be taken back: no refund for that payment.
  const { data: sent } = await serviceClient.from('ad_slots' as any).select('id').eq('stripe_session_id', ad.stripe_session_id).eq('plan', 'single').eq('editions_left', 0).limit(1);
  if (sent?.length) return null;
  const session = await stripe().checkout.sessions.retrieve(ad.stripe_session_id);
  const intentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!intentId) throw new Error('no payment to refund');
  const refund = await refundMinusFee(intentId, { ad_id: String(ad.id) });
  await serviceClient.from('ad_slots' as any).update({ status: 'ended', refunded_at: new Date().toISOString(), canceled_at: new Date().toISOString() }).eq('stripe_session_id', ad.stripe_session_id);
  refreshAdPages();
  await notifyAdDiscord(`↩️ Sponsor refunded $${(refund.refunded / 100).toFixed(2)} (weekly, one-time) and ended: ${ad.name}`);
  return { refunded: refund.refunded };
}

// The refund window for an ad's latest charge (for the "Cancel and refund" button).
export async function refundableUntil(subscriptionId: string): Promise<string | null> {
  const { data } = await stripe().invoices.list({ subscription: subscriptionId, status: 'paid', limit: 1 }).catch(() => ({ data: [] as Stripe.Invoice[] }));
  const until = data[0] ? data[0].created * 1000 + REFUND_MS : 0;
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
  if (left === 0) refreshAdPages();
  if (left === 0) await notifyAdDiscord(`📬 Single newsletter edition sent for ${ad.name}; the newsletter slot is free again`);
}

export async function notifyAdDiscord(content: string) {
  const webhook = process.env.DISCORD_PAYMENTS_WEBHOOK;
  if (!webhook) return;
  await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, allowed_mentions: { parse: [] } }) }).catch(err =>
    console.error(`[ads] discord notify failed: ${(err as Error).message}`),
  );
}
