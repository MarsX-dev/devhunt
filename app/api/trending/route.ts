import { NextResponse } from 'next/server';
import { getHomeData } from '@/utils/homeData';
import { toToolRow } from '@/utils/toolRow';

// This week's leaders for the trending list (tool page, profile page, tool modal). Cached by the CDN
// for 30s (and the data itself by getHomeData), so visitors never hit the database for it. Rendered
// on request, not at build time, so a slow database can't fail the build.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { contestants } = await getHomeData();
  return NextResponse.json(contestants.slice(0, 9).map(toToolRow), {
    // 9: one may be the current tool
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' },
  });
}
