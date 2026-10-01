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
        .eq('isPaid', true)
        .eq('product_categories.id', categoryId);
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3600_000);
    const [free, subscription, oneTime, recent, latest, topFree] = await Promise.all([
      base().eq('pricing_type', PRICING.free),
      base().eq('pricing_type', PRICING.subscription),
      base().eq('pricing_type', PRICING.oneTime),
      base().gte('launch_start', monthAgo.toISOString()).lte('launch_start', now.toISOString()),
      db
        .from('products')
        .select('launch_start, product_categories!inner(id)')
        .eq('deleted', false)
        .eq('isPaid', true)
        .eq('product_categories.id', categoryId)
        .lte('launch_start', now.toISOString())
        .order('launch_start', { ascending: false })
        .limit(1),
      db
        .from('products')
        .select('slug, name, votes_count, product_categories!inner(id)')
        .eq('deleted', false)
        .eq('isPaid', true)
        .eq('product_categories.id', categoryId)
        .eq('pricing_type', PRICING.free)
        .order('votes_count', { ascending: false })
        .limit(3),
    ]);
    return {
      free: free.count ?? 0,
      subscription: subscription.count ?? 0,
      oneTime: oneTime.count ?? 0,
      launched30d: recent.count ?? 0,
      latestLaunch: ((latest.data ?? [])[0] as { launch_start: string } | undefined)?.launch_start ?? null,
      topFree: ((topFree.data ?? []) as any[]).map(t => ({ slug: t.slug, name: t.name, votes_count: t.votes_count ?? 0 })),
    };
  },
  ['category-hub-stats'],
  { revalidate: 3600 },
);
