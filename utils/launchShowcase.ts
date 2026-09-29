import { unstable_cache } from 'next/cache';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// Real results behind the paid launch pitch: the typical impression range (middle half) and the best
// launches, for paid launches of the last 12 months and for weekly top-3 finishers. Cached for a day.
export interface ShowcaseTool {
  slug: string;
  name: string;
  logo_url: string | null;
  views: number;
}
export interface ShowcaseGroup {
  low: number; // 25th percentile of impressions
  high: number; // 75th percentile
  best: ShowcaseTool[];
}
export interface LaunchShowcase {
  paid: ShowcaseGroup;
  winners: ShowcaseGroup;
}

type Row = { slug: string; name: string; logo_url: string | null; views_count: number | null };

const percentile = (sorted: number[], p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))] : 0);

function group(rows: Row[], bestCount = 4): ShowcaseGroup {
  const byViews = [...rows].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0));
  const ascending = byViews.map(r => r.views_count ?? 0).reverse();
  return {
    low: percentile(ascending, 0.25),
    high: percentile(ascending, 0.75),
    best: byViews.slice(0, bestCount).map(r => ({ slug: r.slug, name: r.name, logo_url: r.logo_url, views: r.views_count ?? 0 })),
  };
}

export const getLaunchShowcase = unstable_cache(
  async (): Promise<LaunchShowcase | null> => {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const yearAgo = new Date(Date.now() - 365 * 864e5).toISOString();
    const columns = 'slug, name, logo_url, views_count';
    const [{ data: ranks }, { data: paid }] = await Promise.all([
      serviceClient.from('product_week_ranks' as never).select('product_id').lte('rank', 3),
      serviceClient.from('products').select(columns).eq('isPaid', true).eq('deleted', false).gte('launch_start', yearAgo).lte('launch_start', weekAgo),
    ]);
    const ids = ((ranks ?? []) as { product_id: number }[]).map(r => r.product_id);
    if (!ids.length || !paid?.length) return null;
    const { data: winners } = await serviceClient.from('products').select(columns).in('id', ids).eq('deleted', false).lte('launch_start', weekAgo);
    if (!winners?.length) return null;
    return { paid: group(paid as Row[]), winners: group(winners as Row[]) };
  },
  ['launch-showcase-v1'],
  { revalidate: 86400 },
);
