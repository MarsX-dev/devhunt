import { NextResponse, type NextRequest } from 'next/server';
import { countryCode, isBot, normalizePath } from '@/utils/analytics';

// Page view beacon (navigator.sendBeacon from components/Analytics). Edge runtime: cheap and fast,
// and the visitor's country comes from Vercel's geo header. Always answers 204.
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  if (isBot(req.headers.get('user-agent'))) return done;
  const body = await req.json().catch(() => null);
  const path = normalizePath(body?.p);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!path || !url || !key) return done;

  await fetch(`${url}/rest/v1/rpc/track_hit`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _path: path,
      _country: countryCode(req.geo?.country ?? req.headers.get('x-vercel-ip-country')),
      _new_today: body?.d === true,
      _new_visitor: body?.n === true,
      // Beacons from pages loaded before this field existed: count their first view of the day as the hour's.
      _new_hour: typeof body?.h === 'boolean' ? body.h : body?.d === true,
    }),
  }).catch(() => null);
  return done;
}
