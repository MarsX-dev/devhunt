import { NextResponse, type NextRequest } from 'next/server';
import { withRef } from '@/utils/ads';
import { countryCode, deviceClass, isBot } from '@/utils/analytics';

// Sponsor links go through here: count the click, then send the visitor on to the advertiser.
// Only ads in ad_slots can be targets (no open redirect). ?src=email marks newsletter clicks.
export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fallback = NextResponse.redirect(new URL('/', req.url), 302);
  if (!Number.isInteger(id) || id <= 0 || !url || !key) return fallback;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  const rows = await fetch(`${url}/rest/v1/ad_slots?id=eq.${id}&select=url`, { headers })
    .then(r => (r.ok ? r.json() : []))
    .catch(() => []);
  const target = rows?.[0]?.url as string | undefined;
  if (!target) return fallback;

  const ua = req.headers.get('user-agent');
  if (!isBot(ua)) {
    const device = req.nextUrl.searchParams.get('src') === 'email' ? 'email' : deviceClass(ua);
    await fetch(`${url}/rest/v1/rpc/track_ad_click`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ _id: id, _country: countryCode(req.geo?.country ?? req.headers.get('x-vercel-ip-country')), _device: device }),
    }).catch(() => null);
  }
  return NextResponse.redirect(withRef(target), { status: 302, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
