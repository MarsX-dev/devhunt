import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import AwardsService from '@/utils/supabase/services/awards';
import { getHomeData } from '@/utils/homeData';
import { type ProductType } from '@/type';

// A finished week's rank never changes, so it is cached for a week. The `product_ranks` view ranks every
// product ever launched on each call (~100ms of DB time), which made it the heaviest query on the site.
const finalWeekRank = (productId: number) =>
  unstable_cache(
    async () => {
      const ranks = await new AwardsService(createBrowserClient()).getProductRanks(productId);
      return Number((ranks[0] as any)?.rank) || null;
    },
    ['final-week-rank', String(productId)],
    { revalidate: 7 * 24 * 3600 },
  )();

// The tool's rank in its launch week: none before launch, the live position (from the home page's
// cached ranking) during the week, and the final rank afterwards.
export async function getWeekRank(tool: Pick<ProductType, 'id' | 'launch_start' | 'launch_end'>): Promise<number | undefined> {
  const now = Date.now();
  if (!tool.launch_start || Date.parse(tool.launch_start) > now) return undefined;
  if (!tool.launch_end || Date.parse(tool.launch_end as string) >= now) {
    const idx = (await getHomeData()).contestants.findIndex(t => t.id === tool.id);
    return idx === -1 ? undefined : idx + 1;
  }
  return (await finalWeekRank(tool.id)) ?? undefined;
}
