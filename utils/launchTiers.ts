// Paid launch tiers (products.launch_tier). Lists of a launch week are ordered by votes; on equal
// votes boosted tools come first, then basic, then free (0). Weekly winners are decided by votes only.
export type LaunchTier = 'basic' | 'boost';

export const LAUNCH_TIERS: Record<LaunchTier, { price: number; regionalPrice: number; rank: number }> = {
  basic: { price: 19, regionalPrice: 9, rank: 1 }, // everything except the dedicated post on X
  boost: { price: 49, regionalPrice: 29, rank: 2 }, // Stripe price LAUNCH_PRICE_ID (full price only)
};

export const isLaunchTier = (t: unknown): t is LaunchTier => t === 'basic' || t === 'boost';

// High-income countries (World Bank list, roughly), plus countries that already bought at full price
// (AR, MA, TR), pay the full price; every other known country gets the regional price. Unknown country
// (XX: no geo header, e.g. locally) pays full price.
const FULL_PRICE_COUNTRIES = new Set(
  (
    'US CA GB IE AU NZ JP KR SG HK TW MO IL AE QA KW BH SA OM BN ' +
    'DE FR NL BE LU AT CH LI MC SM AD IS NO SE DK FI IT ES PT MT CY GR SI SK CZ PL HU HR RO BG EE LV LT ' +
    'CL UY PA PR BS BB AG KN TT AW CW SX KY BM VG VI TC GU MP GL FO GI IM JE GG NC PF SC NR GY RU ' +
    'AR MA TR'
  ).split(' '),
);

export const hasRegionalPrice = (country: string | null | undefined): boolean =>
  !!country && /^[A-Z]{2}$/.test(country) && country !== 'XX' && !FULL_PRICE_COUNTRIES.has(country);

export const launchPrice = (tier: LaunchTier, regional: boolean): number => (regional ? LAUNCH_TIERS[tier].regionalPrice : LAUNCH_TIERS[tier].price);

// The free queue, as shown to makers: in years, not a date (a far-off date reads like a bug).
export const FREE_QUEUE_YEARS = 3;
