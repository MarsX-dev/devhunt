import { unstable_cache } from 'next/cache';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { type StatItem } from '@/utils/statFormat';

export { formatStat, type StatItem } from '@/utils/statFormat';

// Ahrefs Domain Rating; there is no Ahrefs API key, so it is set by hand (DOMAIN_RATING env var).
export const DOMAIN_RATING = process.env.DOMAIN_RATING ?? '65';

export interface SiteStats {
  total_views: number;
  views_today: number;
  tools_launched: number;
  tools_this_week: number;
  users: number;
  users_today: number;
}

export const getSiteStats = unstable_cache(
  async (): Promise<SiteStats | null> => {
    const { data, error } = await serviceClient.rpc('get_site_stats' as never);
    if (error) {
      console.error('site stats failed:', error.message);
      return null;
    }
    return data as unknown as SiteStats;
  },
  ['site-stats-v2'],
  { revalidate: 600 },
);

export function statItems(stats: SiteStats): StatItem[] {
  return [
    { label: 'impressions', value: stats.total_views, delta: stats.views_today, deltaLabel: 'today' },
    { label: 'domain_rating', value: DOMAIN_RATING, note: 'ahrefs' },
    { label: 'tools_launched', value: stats.tools_launched, delta: stats.tools_this_week, deltaLabel: 'this week' },
    { label: 'developers', value: stats.users, delta: stats.users_today, deltaLabel: 'today' },
  ];
}
