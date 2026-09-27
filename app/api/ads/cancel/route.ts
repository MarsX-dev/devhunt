import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { syncAdSubscription } from '@/utils/server/ads';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { stripe } from '@/utils/server/stripe';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Cancel (or resume) at period end: the ad stays live for the month already paid.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { adId, resume } = (await req.json().catch(() => ({}))) as { adId?: number; resume?: boolean };
  const { data } = await serviceClient.from('ad_slots' as any).select('id, user_id, status, stripe_subscription_id').eq('id', Number(adId)).single();
  const ad = data as any;
  if (!ad || ad.user_id !== user.id || !ad.stripe_subscription_id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!['active', 'canceling'].includes(ad.status)) return NextResponse.json({ error: 'This ad is not running.' }, { status: 409 });

  const sub = await stripe().subscriptions.update(ad.stripe_subscription_id, { cancel_at_period_end: !resume });
  await syncAdSubscription(sub);
  await logPaymentEvent({ event: resume ? 'ad_resumed' : 'ad_canceled', userId: user.id, details: { ad_id: ad.id } });
  return NextResponse.json({ ok: true });
}
