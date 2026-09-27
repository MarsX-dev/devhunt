import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { toToolCardProps } from '@/utils/toolCard';
import { PAST_WINNERS, toToolRow, type ToolRowData } from '@/utils/toolRow';
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
    const [weeks, winnersPage] = await Promise.all([
      products.getPrevLaunchWeeks(year, 2, week, 1),
      products.getWeeklyWinnersPage(0, PAST_WINNERS + 1), // +1: the running week is left out
    ]);
    const isRunningWeek = (row: { week: number; year: number }) => row.week === week && row.year === year;
    const shown = winnersPage.rows.filter(row => !isRunningWeek(row)).slice(0, PAST_WINNERS);
    return {
      week,
      year,
      contestants: (weeks[0]?.products ?? []).filter(p => p.week == week && p.launch_start).map(toToolCardProps),
      winners: shown.map(row => toToolRow(row.product)),
      winnersOffset: shown.length + (winnersPage.rows.some(isRunningWeek) ? 1 : 0),
      winnersTotal: winnersPage.total,
    };
  },
  ['home-data'],
  { revalidate: 30 },
);
