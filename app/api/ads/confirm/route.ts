import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { activateAd } from '@/utils/server/ads';
import { stripe } from '@/utils/server/stripe';

export const dynamic = 'force-dynamic';

// Success page after Stripe: verifies the session server-side and activates the ad if the webhook hasn't.
export async function GET(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sessionId = new URL(req.url).searchParams.get('session_id') ?? '';
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  const session = await stripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!session || session.metadata?.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const result = await activateAd(session, 'confirm');
  return NextResponse.json({ status: result.status });
}
