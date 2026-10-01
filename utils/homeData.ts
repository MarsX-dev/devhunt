import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { toToolCardProps } from '@/utils/toolCard';
import { PAST_WINNERS, TOOL_ROW_COLUMNS, toToolRow, type ToolRowData } from '@/utils/toolRow';
import { type ProductType } from '@/type';

// The date used to find the running launch week (weeks start on Tuesday; early January still
// belongs to the last week of the previous year until the first Tuesday).
export function launchWeekDate(now = new Date()): Date {
  const year = now.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const firstTuesday = new Date(jan1.getTime() + ((2 - jan1.getDay() + 7) % 7) * 86400000);
  return now < firstTuesday ? new Date(year - 1, 11, 31, 23, 59, 59) : now;
}

export interface HomeData {
  week: number;
  year: number;
  contestants: ProductType[];
  makers: Record<string, { name: string; avatar: string }>; // product id -> maker, for the top 3
  others: ToolRowData[]; // "other" tools (not for developers) launching now: listed, no votes
  winners: ToolRowData[];
  winnersOffset: number; // raw rows consumed (for "Show more")
  winnersTotal: number;
}

// Everything the home page lists, rendered on the server (cached briefly) instead of fetched by
// the browser after load.
export const getHomeData = unstable_cache(
  async (): Promise<HomeData> => {
    const products = new ProductsService(createBrowserClient());
    const today = launchWeekDate();
    const year = today.getFullYear();
    const week = await products.getWeekNumber(today, 2);
    const nowIso = new Date().toISOString();
    const [weeks, winnersPage, othersResult] = await Promise.all([
      products.getPrevLaunchWeeks(year, 2, week, 1),
      products.getWeeklyWinnersPage(0, PAST_WINNERS + 1), // +1: the running week is left out
      createBrowserClient()
        .from('products')
        .select(TOOL_ROW_COLUMNS)
        .eq('moderation', 'not_a_fit')
        .eq('deleted', false)
        .lte('launch_start', nowIso)
        .gte('launch_end', nowIso)
        .order('launch_tier', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(60),
    ]);
    const isRunningWeek = (row: { week: number; year: number }) => row.week === week && row.year === year;
    const shown = winnersPage.rows.filter(row => !isRunningWeek(row)).slice(0, PAST_WINNERS);
    const contestants = (weeks[0]?.products ?? []).filter(p => p.week == week && p.launch_start).map(toToolCardProps);
    const top = contestants.slice(0, 3);
    const { data: profiles } = await createBrowserClient()
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', top.map(p => p.owner_id).filter((id): id is string => !!id))
      .is('deleted_at', null);
    const makers: HomeData['makers'] = {};
    for (const p of top) {
      const profile = profiles?.find(row => row.id === p.owner_id);
      if (profile?.full_name) makers[p.id] = { name: profile.full_name, avatar: profile.avatar_url ?? '' };
    }
    return {
      week,
      year,
      contestants,
      makers,
      others: (othersResult.data ?? []).map(toToolRow),
      winners: shown.map(row => toToolRow(row.product)),
      winnersOffset: shown.length + (winnersPage.rows.some(isRunningWeek) ? 1 : 0),
      winnersTotal: winnersPage.total,
    };
  },
  ['home-data-v2'],
  { revalidate: 30 },
);
