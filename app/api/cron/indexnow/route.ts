import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/utils/cronAuth';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { INDEXNOW_ENDPOINT, indexNowPayload } from '@/utils/indexnow';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Daily IndexNow ping (Vercel Cron, see vercel.json) for tool pages that changed in the last 26 hours:
// edited, launched today, or removed. ?dry=1 returns the payload without sending it.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const since = new Date(Date.now() - 26 * 3600_000).toISOString();
  const now = new Date().toISOString();
  const { data, error } = await serviceClient
    .from('products')
    .select('slug')
    // Edited (live tools only: unlaunched free-queue pages are thin until launch day), launched in the
    // window, or removed (soft delete sets deleted_at, not updated_at).
    .or(
      `and(deleted.eq.false,updated_at.gte.${since},or(launch_start.lte.${now},isPaid.eq.true)),and(deleted.eq.false,launch_start.gte.${since},launch_start.lte.${now}),deleted_at.gte.${since}`,
    )
    .limit(10_000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payload = indexNowPayload((data ?? []) as { slug: string }[]);
  if (new URL(req.url).searchParams.get('dry') === '1') return NextResponse.json(payload);

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  // 200/202 = accepted. 403 = key file not reachable, 422 = URLs don't match the host.
  return NextResponse.json({ status: res.status, submitted: payload.urlList.length }, { status: res.ok ? 200 : 502 });
}
