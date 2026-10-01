import prune from './blogPrune.json';

// Blog cleanup (seo-plan.md A6, 2026-10-01), from 16 months of Search Console data on the SEObot posts:
// - redirects: near-duplicate posts merged into the best-performing post on the same topic (308).
// - noindex: posts with no clicks in 16 months and no impressions or an average position below 50.
// Both are reversible: remove a slug from blogPrune.json. The posts stay in SEObot.
const redirects: Record<string, string> = prune.redirects;
const noindex = new Set<string>(prune.noindex);

export const blogRedirect = (slug: string): string | undefined => redirects[slug];
export const blogNoindex = (slug: string): boolean => noindex.has(slug);
// Posts that belong in the blog sitemap: not merged away, not noindexed.
export const blogIndexable = (slug: string): boolean => !redirects[slug] && !noindex.has(slug);
