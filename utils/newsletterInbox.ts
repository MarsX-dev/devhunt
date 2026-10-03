import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { launchWeekDate } from '@/utils/homeData';

export interface InboxEmail {
  week: number;
  sentAt: string; // the Tuesday the "Top 3" email went out (end of the launch week)
  tools: { slug: string; name: string; slogan: string | null; logo_url: string | null; votes_count: number }[];
}

// The weekly "Top 3" emails a subscriber got over the last weeks (same data the cron email uses).
export const getNewsletterInbox = unstable_cache(
  async (): Promise<InboxEmail[]> => {
    const products = new ProductsService(createBrowserClient());
    const today = launchWeekDate();
    const currentWeek = await products.getWeekNumber(today, 2);
    const year = currentWeek > 1 ? today.getFullYear() : today.getFullYear() - 1;
    const lastWeek = currentWeek > 1 ? currentWeek - 1 : 53;
    const weeks = await products.getPrevLaunchWeeks(year, 2, lastWeek, 6);
    return weeks
      .filter(w => w.products.length)
      .sort((a, b) => b.week - a.week)
      .map(w => ({
        week: w.week,
        sentAt: w.endDate.toISOString(),
        tools: [...w.products]
          .sort((a, b) => (b.votes_count ?? 0) - (a.votes_count ?? 0))
          .slice(0, 3)
          .map(p => ({ slug: p.slug, name: p.name, slogan: p.slogan, logo_url: p.logo_url, votes_count: p.votes_count ?? 0 })),
      }));
  },
  ['newsletter-inbox'],
  { revalidate: 3600 },
);
