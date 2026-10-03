import { NextResponse, type NextRequest } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { trackFunnel } from '@/utils/server/funnel';
import { CLIENT_STEPS, cleanId, cleanUtm, deviceFrom, type FunnelStep } from '@/utils/funnel';
import { countryCode, isBot } from '@/utils/analytics';

export const dynamic = 'force-dynamic';

// Browser funnel steps (utils/funnelClient.ts). Always 204; the signed-in user comes from the
// session cookie, never from the request body.
export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  if (isBot(req.headers.get('user-agent'))) return done;
  const body = await req.json().catch(() => null);
  if (!body || !CLIENT_STEPS.has(body.step)) return done;
  const user = await getRouteUser().catch(() => null);
  let referrer: string | null = null;
  try {
    const host = body.ref ? new URL(body.ref).hostname : null;
    referrer = host && !host.endsWith('devhunt.org') && host !== req.nextUrl.hostname ? host : null;
  } catch {}
  await trackFunnel({
    step: body.step as FunnelStep,
    userId: user?.id ?? null,
    productId: Number.isInteger(body.productId) ? body.productId : null,
    props: { ...(body.props ?? {}), path: typeof body.path === 'string' ? body.path : undefined },
    visitorId: cleanId(body.vid),
    sessionId: cleanId(body.sid),
    referrer,
    utm: cleanUtm(body.utm),
    country: countryCode(req.geo?.country ?? req.headers.get('x-vercel-ip-country')),
    device: deviceFrom(req.headers.get('user-agent')),
  });
  return done;
}
