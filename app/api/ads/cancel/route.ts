import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { refundSubscription, syncAdSubscription } from '@/utils/server/ads';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { stripe } from '@/utils/server/stripe';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Cancel (or resume) at period end: the ads stay live for the month already paid. Acts on the whole
// subscription, i.e. every ad bought in the same checkout.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { adId, resume, refund } = (await req.json().catch(() => ({}))) as { adId?: number; resume?: boolean; refund?: boolean };
  const { data } = await serviceClient.from('ad_slots' as any).select('id, name, user_id, status, stripe_subscription_id').eq('id', Number(adId)).single();
  const ad = data as any;
  if (!ad || ad.user_id !== user.id || !ad.stripe_subscription_id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!['active', 'canceling'].includes(ad.status)) return NextResponse.json({ error: 'This ad is not running.' }, { status: 409 });

  if (refund) {
    const result = await refundSubscription(ad.stripe_subscription_id, ad.name).catch(err => {
      console.error('ad refund failed:', (err as Error).message);
      return undefined;
    });
    if (result === undefined) return NextResponse.json({ error: 'The refund failed. Please email john@marsx.dev.' }, { status: 502 });
    if (result === null) return NextResponse.json({ error: 'The refund window for your last payment has passed. You can still cancel.' }, { status: 409 });
    await logPaymentEvent({ event: 'ad_refunded', userId: user.id, amountTotal: result.refunded, details: { ad_id: ad.id } });
    return NextResponse.json({ ok: true, refunded: result.refunded });
  }

  const sub = await stripe().subscriptions.update(ad.stripe_subscription_id, { cancel_at_period_end: !resume });
  await syncAdSubscription(sub);
  await logPaymentEvent({ event: resume ? 'ad_resumed' : 'ad_canceled', userId: user.id, details: { ad_id: ad.id } });
  return NextResponse.json({ ok: true });
}
