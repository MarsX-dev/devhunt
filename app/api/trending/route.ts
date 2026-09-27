import { NextResponse } from 'next/server';
import { getHomeData } from '@/utils/homeData';
import { toToolRow } from '@/utils/toolRow';

// This week's leaders for the trending list (tool page, profile page, tool modal). Served from the CDN
// and revalidated every 30s, so visitors never hit the database for it.
export const revalidate = 30;

export async function GET() {
  const { contestants } = await getHomeData();
  return NextResponse.json(contestants.slice(0, 9).map(toToolRow)); // 9: one may be the current tool
}
