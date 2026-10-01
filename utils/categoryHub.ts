import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';

// Facts for the top of a category page (seo-plan.md A7): free/paid split, recent launches, top free tools.
// Same filter as the category list (getLeaderboardPage: live, listed tools). Cached for an hour per
// category, so a page view never queries the database for these.

export interface CategoryHubStats {
  free: number;
  subscription: number;
  oneTime: number;
  launched30d: number;
  latestLaunch: string | null;
  topFree: { slug: string; name: string; votes_count: number }[];
  wellKnown: { slug: string; name: string; logo_url: string | null }[]; // DevHunt's reference listings in this category
}

const PRICING = { free: 1, subscription: 2, oneTime: 3 } as const;

export const getCategoryHubStats = unstable_cache(
  async (categoryId: number): Promise<CategoryHubStats> => {
    const db = createBrowserClient();
    const base = () =>
      db
        .from('products')
        .select('id, product_categories!inner(id)', { count: 'exact', head: true })
        .eq('deleted', false)
        .or('isPaid.eq.true,is_reference.eq.true')
        .eq('product_categories.id', categoryId);
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3600_000);
    const [free, subscription, oneTime, recent, latest, topFree, wellKnown] = await Promise.all([
      base().eq('pricing_type', PRICING.free),
      base().eq('pricing_type', PRICING.subscription),
      base().eq('pricing_type', PRICING.oneTime),
      base().gte('launch_start', monthAgo.toISOString()).lte('launch_start', now.toISOString()),
      db
        .from('products')
        .select('launch_start, product_categories!inner(id)')
        .eq('deleted', false)
        .or('isPaid.eq.true,is_reference.eq.true')
        .eq('product_categories.id', categoryId)
        .lte('launch_start', now.toISOString())
        .order('launch_start', { ascending: false })
        .limit(1),
      db
        .from('products')
        .select('slug, name, votes_count, product_categories!inner(id)')
        .eq('deleted', false)
        .or('isPaid.eq.true,is_reference.eq.true')
        .eq('product_categories.id', categoryId)
        .eq('pricing_type', PRICING.free)
        .order('votes_count', { ascending: false })
        .limit(3),
      db
        .from('products')
        .select('slug, name, logo_url, product_categories!inner(id)')
        .eq('deleted', false)
        .eq('is_reference', true)
        .eq('product_categories.id', categoryId)
        .order('votes_count', { ascending: false })
        .order('id', { ascending: true })
        .limit(12),
    ]);
    return {
      free: free.count ?? 0,
      subscription: subscription.count ?? 0,
      oneTime: oneTime.count ?? 0,
      launched30d: recent.count ?? 0,
      latestLaunch: ((latest.data ?? [])[0] as { launch_start: string } | undefined)?.launch_start ?? null,
      topFree: ((topFree.data ?? []) as any[]).map(t => ({ slug: t.slug, name: t.name, votes_count: t.votes_count ?? 0 })),
      wellKnown: ((wellKnown.data ?? []) as any[]).map(t => ({ slug: t.slug, name: t.name, logo_url: t.logo_url ?? null })),
    };
  },
  ['category-hub-stats'],
  { revalidate: 3600 },
);
