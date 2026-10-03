// Sponsor products: shared by the rails, the advertise pages, the newsletter and the API.
export type AdKind = 'rail' | 'inline' | 'newsletter';

export interface AdProduct {
  kind: AdKind;
  title: string;
  price: number; // USD per month, recurring (WEEKLY_PRICE: one week)
  slots: number; // for sale at the same time
  per?: string; // what one month buys, when it isn't obvious
  where: string[]; // the card's bullets: short, no repeats
}

export const AD_PRODUCTS: Record<AdKind, AdProduct> = {
  rail: {
    kind: 'rail',
    title: 'Sidebar card',
    price: 499,
    slots: 6,
    where: ['On every page of DevHunt', 'Stays in view while visitors scroll', 'Always shown, never rotated'],
  },
  inline: {
    kind: 'inline',
    title: 'Inline listing',
    price: 299,
    slots: 6,
    where: ['Your product listed among the tools', "Right under the week's top 3", 'On the home, tool and category pages'],
  },
  newsletter: {
    kind: 'newsletter',
    title: 'Weekly newsletter',
    price: 999,
    slots: 1,
    per: '4 editions',
    where: ['At the top of the weekly email', 'Banner, headline and description', 'Sent every Wednesday'],
  },
};

// How an ad is paid. Weekly (the default) is a one-time payment: a sidebar or inline ad runs for 7 days
// (plan 'weekly'), a newsletter ad for one edition (plan 'single', the newsletter goes out weekly).
// Monthly is a subscription and works out ~16% cheaper than 4 weeks.
export type AdPlan = 'monthly' | 'single' | 'weekly';
export const WEEK_DAYS = 7;
export const WEEKLY_PRICE: Record<AdKind, number> = { rail: 149, inline: 89, newsletter: 299 };
export const NEWSLETTER_SINGLE_PRICE = WEEKLY_PRICE.newsletter;
export const isAdPlan = (p: unknown): p is AdPlan => p === 'monthly' || p === 'single' || p === 'weekly';
// The one-time plan of a product.
export const weeklyPlan = (kind: AdKind): AdPlan => (kind === 'newsletter' ? 'single' : 'weekly');
export const planPrice = (kind: AdKind, plan: AdPlan = 'monthly') => (plan === 'monthly' ? AD_PRODUCTS[kind].price : WEEKLY_PRICE[kind]);
export const isRecurring = (_kind: AdKind, plan: AdPlan = 'monthly') => plan === 'monthly';
export const planLabel = (kind: AdKind, plan: AdPlan = 'monthly') =>
  isRecurring(kind, plan)
    ? `$${planPrice(kind, plan)}/month${AD_PRODUCTS[kind].per ? ` · ${AD_PRODUCTS[kind].per}` : ''}`
    : `$${planPrice(kind, plan)} once · ${plan === 'single' ? '1 edition' : '1 week'}`;
// Expected views for a booking, from the live ads' impressions (2026-09-28..30 full days: a sidebar
// card ~3.2K-6.9K a day, an inline row ~0.5K-1K a day) and the newsletter list. Update as data grows.
const WEEKLY_VIEWS: Record<AdKind, [number, number]> = { rail: [20_000, 45_000], inline: [3_500, 7_000], newsletter: [40_000, 40_000] }; // newsletter: AUDIENCE.newsletterSubscribers
const k = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}K`.replace('.0K', 'K') : String(n));
export function viewsEstimate(kind: AdKind, plan: AdPlan) {
  const weeks = plan === 'monthly' ? 4 : 1;
  const [lo, hi] = WEEKLY_VIEWS[kind].map(n => n * weeks);
  const per = plan === 'monthly' ? ' a month' : plan === 'single' ? '' : ' a week';
  if (kind === 'newsletter') return `${k(lo)} inboxes${per}`;
  return `~${k(lo)}–${k(hi)} views${per}`;
}

// Saving of monthly against 4 one-time weeks, in percent.
export const monthlySaving = (kind: AdKind) => Math.round((1 - AD_PRODUCTS[kind].price / (4 * WEEKLY_PRICE[kind])) * 100);

export const AD_KINDS = Object.keys(AD_PRODUCTS) as AdKind[];

// "5 of 6 spots left". `free` = unsold slots. Our own products (ListingBott) buy spots like any
// advertiser (with a 100% coupon), so every taken spot is a real ad.
export function spotsLeft(kind: AdKind, free: number) {
  const total = AD_PRODUCTS[kind].slots;
  if (free <= 0) return 'sold out';
  return `${free} of ${total} spot${total > 1 ? 's' : ''} left`;
}
export const isAdKind = (k: unknown): k is AdKind => typeof k === 'string' && k in AD_PRODUCTS;

// Refund the latest payment (and stop the ads it paid for) within this many hours of the charge; after that, no refunds.
export const REFUND_HOURS = 24;
export const REFUND_MS = REFUND_HOURS * 3600_000;
// Refunds keep this percentage of the payment: Stripe doesn't give its processing fee back to us.
export const REFUND_FEE_PCT = 5;
export const REFUND_FEE_NOTE = `Refunds return your payment minus ${REFUND_FEE_PCT}% to cover Stripe's processing fee, which Stripe keeps and doesn't return to us.`;

// Where inline sponsor rows go in a tool list (components/ui/Sponsors/InlineSponsor): before the
// 4th item, then every 8 items. Lists shorter than 4 items get none. Tune placement here.
export const INLINE_FIRST = 3; // index of the item the first sponsor row goes before
export const INLINE_EVERY = 8;
export const INLINE_MIN_LIST = 4;
export const INLINE_MAX_OPEN = 2; // unsold: at most this many "open spot" rows per list
// The sponsor row's ordinal in the list (0, 1, ...) if one goes right before item `idx`, else -1.
export function sponsorBefore(idx: number, length: number) {
  if (length < INLINE_MIN_LIST || idx < INLINE_FIRST || (idx - INLINE_FIRST) % INLINE_EVERY) return -1;
  return (idx - INLINE_FIRST) / INLINE_EVERY;
}

// Kept for the rails.
export const AD_SLOTS = AD_PRODUCTS.rail.slots;
export const AD_PRICE_USD = AD_PRODUCTS.rail.price;

// Audience numbers for the pitch that aren't in the database (from the analytics dashboard).
export const AUDIENCE = {
  pageViewsPerMonth: 150_000,
  avgVisitMinutes: 2,
  newsletterSubscribers: 40_000,
  countries: [
    { name: 'United States', pct: 35 },
    { name: 'Singapore', pct: 13 },
    { name: 'India', pct: 10 },
    { name: 'China', pct: 4 },
    { name: 'United Kingdom', pct: 3 },
    { name: 'Pakistan', pct: 2 },
    { name: 'France', pct: 2 },
    { name: 'Brazil', pct: 2 },
    { name: 'Canada', pct: 2 },
    { name: 'Germany', pct: 2 },
  ],
  devices: [
    { name: 'Desktop', pct: 46 },
    { name: 'Laptop', pct: 36 },
    { name: 'Mobile', pct: 17 },
    { name: 'Tablet', pct: 1 },
  ],
};

export interface PublicAd {
  id?: number; // paid ads only (impressions and clicks are tracked by id)
  kind?: AdKind;
  slot: number;
  name: string;
  tagline: string;
  url: string;
  logo_url: string | null;
}

// Outgoing sponsor links carry ?ref=devhunt so advertisers see us in their analytics.
export function withRef(url: string) {
  try {
    const u = new URL(url);
    if (!u.searchParams.has('ref')) u.searchParams.set('ref', 'devhunt');
    return u.toString();
  } catch {
    return url;
  }
}

export const LIVE_STATUSES = ['active', 'canceling'] as const;
