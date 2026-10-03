import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Advertiser portal stats: impressions and clicks by day, country and device for the caller's ads
// (all of them, or ?ad=<id>), over ?days=7|30|90 (0 = since the start).
export async function GET(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const days = [7, 30, 90, 0].includes(Number(params.get('days'))) ? Number(params.get('days')) : 30;
  const only = Number(params.get('ad')) || null;

  const { data: mine } = await serviceClient.from('ad_slots' as any).select('id').eq('user_id', user.id).not('started_at', 'is', null);
  const ids = ((mine ?? []) as any[]).map(r => r.id as number).filter(id => !only || id === only);
  if (!ids.length) return NextResponse.json({ totals: { impressions: 0, clicks: 0 }, daily: [], countries: [], devices: [], ads: [], from: null });

  const from = days ? new Date(Date.now() - (days - 1) * 86400_000).toISOString().slice(0, 10) : '2000-01-01';
  const { data, error } = await serviceClient.rpc('ad_stats' as never, { _ids: ids, _from: from } as never);
  if (error) return NextResponse.json({ error: 'Could not load stats.' }, { status: 500 });
  return NextResponse.json({ ...(data as object), from: days ? from : null });
}
