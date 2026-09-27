// Sponsor products: shared by the rails, the advertise pages, the newsletter and the API.
export type AdKind = 'rail' | 'inline' | 'newsletter';

export interface AdProduct {
  kind: AdKind;
  title: string;
  price: number; // USD per month, recurring
  slots: number; // for sale at the same time
  house: number; // spots our own ad (ListingBott) holds; counted as taken so the scarcity is real
  per?: string; // what one month buys, when it isn't obvious
  pitch: string;
  where: string[];
}

export const AD_PRODUCTS: Record<AdKind, AdProduct> = {
  rail: {
    kind: 'rail',
    title: 'Sidebar card',
    price: 499,
    slots: 5,
    house: 1,
    pitch: 'Your logo, name and headline in a card beside the content on every public page of DevHunt, all month long.',
    where: ['Every public page: home, tool pages, categories, blog', 'Stays in view while visitors scroll (desktop)', 'Scrolling logo strip under the header on mobile', 'Only 6 spots, never rotated'],
  },
  inline: {
    kind: 'inline',
    title: 'Inline listing',
    price: 299,
    slots: 3,
    house: 1,
    pitch: 'A row inside the tool lists developers browse to find new tools, styled like the launches around it and marked "Sponsored".',
    where: ['Home page, right after the top 3 launches of the week', 'Every category list, after the 5th tool', 'Logo, name and headline, links to your site', 'Only 4 sponsors share the spot'],
  },
  newsletter: {
    kind: 'newsletter',
    title: 'Weekly newsletter',
    price: 999,
    slots: 1,
    house: 0,
    per: '4 editions',
    pitch: 'The only sponsor in the weekly DevHunt email, sent to 40,000 developers. Monthly (4 editions) or a single edition to try it.',
    where: ['4 editions a month, one every week, or a single one', 'Banner, headline and description', 'The only sponsor in each email'],
  },
};

// How an ad is paid: every product is monthly; the newsletter can also be bought for one edition.
export type AdPlan = 'monthly' | 'single';
export const NEWSLETTER_SINGLE_PRICE = 299;
export const isAdPlan = (p: unknown): p is AdPlan => p === 'monthly' || p === 'single';
export const planPrice = (kind: AdKind, plan: AdPlan = 'monthly') => (kind === 'newsletter' && plan === 'single' ? NEWSLETTER_SINGLE_PRICE : AD_PRODUCTS[kind].price);
export const isRecurring = (kind: AdKind, plan: AdPlan = 'monthly') => !(kind === 'newsletter' && plan === 'single');
export const planLabel = (kind: AdKind, plan: AdPlan = 'monthly') =>
  isRecurring(kind, plan) ? `$${planPrice(kind, plan)}/month${AD_PRODUCTS[kind].per ? ` · ${AD_PRODUCTS[kind].per}` : ''}` : `$${planPrice(kind, plan)} once · 1 edition`;

export const AD_KINDS = Object.keys(AD_PRODUCTS) as AdKind[];

// "5 of 6 spots left": our own ad counts as a taken spot. `free` = unsold paid slots.
export function spotsLeft(kind: AdKind, free: number) {
  const p = AD_PRODUCTS[kind];
  const total = p.slots + p.house;
  if (free <= 0) return 'sold out';
  return `${free} of ${total} spot${total > 1 ? 's' : ''} left`;
}
export const isAdKind = (k: unknown): k is AdKind => typeof k === 'string' && k in AD_PRODUCTS;

// Refund the latest payment (and stop the ad) within this many days of the charge.
export const REFUND_DAYS = 7;

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

// Our own ad: always the first rail card, and the inline ad when no inline slot is sold.
export const HOUSE_AD: PublicAd = {
  slot: 0,
  name: 'ListingBott',
  tagline: 'Submit your product to 100+ directories. Backlinks on autopilot.',
  url: 'https://listingbott.com/?ref=devhunt',
  logo_url: 'https://www.google.com/s2/favicons?domain=listingbott.com&sz=128',
};

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
