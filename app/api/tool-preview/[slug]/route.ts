import { NextResponse } from 'next/server';
import { getToolPageData } from '@/utils/toolPageData';
import { getWeekRank } from '@/utils/weekRank';

// Everything the tool preview modal shows below the card data, in one response cached by the CDN
// (30s, the same cached loader as the tool page). Stepping through tools with ←/→ used to fire
// ~5 separate Supabase queries per step from every browser.
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params: { slug } }: { params: { slug: string } }) {
  const data = await getToolPageData(decodeURIComponent(slug));
  if (!data) return NextResponse.json(null, { status: 404 });
  const { product, owner, comments, extras, profile } = data;
  const weekRank = (await getWeekRank(product)) ?? null;
  return NextResponse.json(
    { owner, comments: comments ?? [], extras, profile, weekRank },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } },
  );
}
