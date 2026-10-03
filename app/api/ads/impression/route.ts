import { NextResponse, type NextRequest } from 'next/server';
import { countryCode, deviceClass, isBot } from '@/utils/analytics';

// Sponsor impressions beacon: every paid ad seen on one page view, in one call (see
// components/ui/Sponsors/track.ts). Edge runtime like /api/hit; always answers 204.
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  const ua = req.headers.get('user-agent');
  if (isBot(ua)) return done;
  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? (body.ids as unknown[]).map(Number).filter(n => Number.isInteger(n) && n > 0).slice(0, 12) : [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!ids.length || !url || !key) return done;

  await fetch(`${url}/rest/v1/rpc/track_ad_impressions`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ _ids: ids, _country: countryCode(req.geo?.country ?? req.headers.get('x-vercel-ip-country')), _device: deviceClass(ua) }),
  }).catch(() => null);
  return done;
}
