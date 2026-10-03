import { unstable_cache } from 'next/cache';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// The public numbers behind /stats (get_public_stats): the last 30 days day by day plus all-time
// totals. Cached for 10 minutes, so pages using it add no per-visitor queries.
export interface Day {
  day: string;
  visitors: number;
  pageviews: number;
  new_visitors: number;
  tool_impressions: number;
  visitors_est: number; // estimates for days before a counter existed (stats_estimates), 0 if none
  pageviews_est: number;
  tool_impressions_est: number;
  ad_impressions_web: number;
  ad_impressions_email: number;
  launches: number;
  submissions: number;
  signups: number;
  users: number;
}
export interface PublicStats {
  daily: Day[];
  countries: { country: string; visitors: number }[];
  visitors_since: string | null;
  impressions_since: string | null;
  ads_since: string | null;
  unique_visitors_all_time: number;
  tool_impressions_all_time: number;
  tools_launched: number;
  tools_total: number;
  pageviews_tracked: number;
  users: number;
  launch_impressions_median: number;
  first_launch: string;
}

export const getPublicStats = unstable_cache(
  async (): Promise<PublicStats | null> => {
    const { data, error } = await serviceClient.rpc('get_public_stats' as never);
    if (error) throw new Error(error.message); // thrown, so a failure isn't cached for 10 minutes
    return data as unknown as PublicStats;
  },
  ['public-stats-v5'],
  { revalidate: 600 },
);

// 30-day totals. Days before a counter existed count their estimate (stats_estimates) when there
// is one; `total` is the counted part only.
export function series(daily: Day[], since: string | null, value: (d: Day) => number, estimate?: (d: Day) => number) {
  const tracked = since ? daily.filter(d => d.day >= since) : [];
  const total = tracked.reduce((sum, d) => sum + Number(value(d)), 0);
  const estimated = estimate ? daily.filter(d => !since || d.day < since).reduce((sum, d) => sum + Number(estimate(d)), 0) : 0;
  return { total, withEstimates: total + estimated, estimated: estimated > 0 };
}

// The headline numbers other pages quote (the paid launch pitch): 30-day totals with estimates for
// the days before tracking started, and all-time totals.
export function statsSummary(s: PublicStats) {
  const sum = (value: (d: Day) => number) => s.daily.reduce((total, d) => total + Number(value(d)), 0);
  return {
    toolImpressions30d: series(s.daily, s.impressions_since, d => d.tool_impressions, d => d.tool_impressions_est).withEstimates,
    visitors30d: series(s.daily, s.visitors_since, d => d.visitors, d => d.visitors_est).withEstimates,
    signups30d: sum(d => d.signups),
    tools30d: sum(d => d.submissions),
    toolImpressionsAllTime: Number(s.tool_impressions_all_time),
    visitorsAllTime: Number(s.unique_visitors_all_time),
    users: Number(s.users),
    toolsTotal: Number(s.tools_total),
  };
}
export type StatsSummary = ReturnType<typeof statsSummary>;
