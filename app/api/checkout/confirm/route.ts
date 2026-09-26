import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { activateFromCheckoutSession } from '@/utils/server/activateLaunch';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { stripe } from '@/utils/server/stripe';

export const dynamic = 'force-dynamic';

// Called by the success page after Stripe redirects back. Verifies the session with the Stripe API
// (never trusting the browser) and activates the launch if the webhook hasn't already.
export async function GET(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = new URL(req.url).searchParams.get('session_id') ?? '';
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });

  const session = await stripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!session || session.metadata?.user_id !== user.id) {
    await logPaymentEvent({ event: 'confirm_rejected', level: 'warn', stripeSessionId: sessionId, userId: user.id, details: { reason: session ? 'session belongs to another user' : 'session not found' } });
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const result = await activateFromCheckoutSession(session, 'confirm');
  return NextResponse.json(result, { status: result.status === 'invalid' ? 400 : 200 });
}
