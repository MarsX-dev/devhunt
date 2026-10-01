// Paid launch tiers (products.launch_tier). Lists of a launch week are ordered by votes; on equal
// votes boosted tools come first, then basic, then free (0). Weekly winners are decided by votes only.
export type LaunchTier = 'basic' | 'boost';

export const LAUNCH_TIERS: Record<LaunchTier, { price: number; rank: number }> = {
  basic: { price: 19, rank: 1 }, // everything except the dedicated post on X
  boost: { price: 49, rank: 2 }, // Stripe price LAUNCH_PRICE_ID
};

export const isLaunchTier = (t: unknown): t is LaunchTier => t === 'basic' || t === 'boost';

// The free queue, as shown to makers: in years, not a date (a far-off date reads like a bug).
export const FREE_QUEUE_YEARS = 3;
