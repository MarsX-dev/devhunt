import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import { getWeekRank } from '@/utils/weekRank';
import { badgeSvg, badgeTheme } from '@/utils/badge';

// /badge/{slug}.svg: the "Featured on DevHunt" image makers embed (utils/badge.ts). It loads on other
// people's sites on every page view, so the CDN caches it for a day and the data for an hour: maker
// traffic never reaches the database per view.
export const dynamic = 'force-dynamic';

const badgeRank = async (slug: string) =>
  await unstable_cache(
    async () => {
      const { data } = await createBrowserClient()
        .from('products')
        .select('id, launch_start, launch_end, deleted')
        .eq('slug', slug)
        .maybeSingle();
      const tool = data as { id: number; launch_start: string | null; launch_end: string | null; deleted: boolean } | null;
      if (!tool || tool.deleted) return null;
      // Only a finished week's rank: a live position would be cached for a day and go stale.
      if (!tool.launch_end || Date.parse(tool.launch_end) > Date.now()) return null;
      return (await getWeekRank(tool)) ?? null;
    },
    ['badge-rank', slug],
    { revalidate: 3600 },
  )();

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug).replace(/\.svg$/, '');
  // An unknown or removed tool still gets the plain badge: a broken image on someone's site helps nobody.
  const rank = await badgeRank(slug).catch(() => null);
  return new Response(badgeSvg({ rank, theme: badgeTheme(new URL(req.url).searchParams.get('theme')) }), {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
