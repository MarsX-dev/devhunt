// Sponsor slots: shared by the rails, the advertise page and the API.
export const AD_SLOTS = 5; // for sale, next to the house ad
export const AD_PRICE_USD = 499; // per slot, per month (recurring)

export interface PublicAd {
  slot: number;
  name: string;
  tagline: string;
  url: string;
  logo_url: string | null;
}

// Our own ad: always the first card, and the inline ad in lists.
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
