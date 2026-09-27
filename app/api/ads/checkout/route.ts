import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { AD_NAME_MAX, AD_TAGLINE_MAX, createAdCheckout, freeSlot, moderateAd, notifyAdDiscord } from '@/utils/server/ads';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Saves the advertiser's edits to their draft, re-checks edited copy, and starts the $499/mo subscription.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { adId?: number; name?: string; tagline?: string };
  const { data } = await serviceClient.from('ad_slots' as any).select('*').eq('id', Number(body.adId)).single();
  const ad = data as any;
  if (!ad || ad.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (ad.status !== 'draft') return NextResponse.json({ error: ad.status === 'blocked' ? "We can't run this ad." : 'This ad is already paid.' }, { status: 409 });

  const name = (body.name ?? ad.name).trim().slice(0, AD_NAME_MAX);
  const tagline = (body.tagline ?? ad.tagline).trim().slice(0, AD_TAGLINE_MAX);
  if (!name || !tagline) return NextResponse.json({ error: 'Name and headline are required.' }, { status: 400 });

  if (name !== ad.name || tagline !== ad.tagline) {
    const moderation = await moderateAd({ url: ad.url, name, tagline });
    await serviceClient.from('ad_slots' as any).update({ name, tagline, ...(moderation.ok ? {} : { status: 'blocked', moderation }) }).eq('id', ad.id);
    if (!moderation.ok) {
      await notifyAdDiscord(`🚫 **Sponsor ad refused after edit** (${moderation.topic}): ${name} · "${tagline}" · ${ad.url} by ${user.email}`);
      return NextResponse.json({ blocked: true }, { status: 409 });
    }
  }

  if (!(await freeSlot())) return NextResponse.json({ error: 'All sponsor slots are taken right now.' }, { status: 409 });

  try {
    const session = await createAdCheckout({ id: ad.id, name, url: ad.url }, user, new URL(req.url).origin);
    await logPaymentEvent({ event: 'ad_checkout_created', stripeSessionId: session.id, userId: user.id, details: { ad_id: ad.id } });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    await logPaymentEvent({ event: 'ad_checkout_error', level: 'error', userId: user.id, details: { ad_id: ad.id, message: (err as Error).message } });
    return NextResponse.json({ error: 'Could not start the payment, please try again.' }, { status: 502 });
  }
}
