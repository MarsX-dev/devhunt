import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { AD_DESCRIPTION_MAX, AD_NAME_MAX, AD_TAGLINE_MAX, createAdCheckout, freeSlot, moderateAd, notifyAdDiscord } from '@/utils/server/ads';
import { AD_PRODUCTS, isAdPlan, type AdKind, type AdPlan } from '@/utils/ads';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Saves the advertiser's edits to their drafts (one per ad type picked), re-checks edited copy, and
// starts one monthly subscription covering all of them.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { adIds?: number[]; name?: string; tagline?: string; description?: string; plans?: Record<string, unknown> };
  const ids = (body.adIds ?? []).map(Number).filter(Boolean);
  if (!ids.length) return NextResponse.json({ error: 'Pick at least one ad type.' }, { status: 400 });
  const { data } = await serviceClient.from('ad_slots' as any).select('*').in('id', ids);
  const ads = ((data ?? []) as any[]).filter(a => a.user_id === user.id);
  if (ads.length !== ids.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (ads.some(a => a.status === 'blocked')) return NextResponse.json({ blocked: true }, { status: 409 });
  if (ads.some(a => a.status !== 'draft')) return NextResponse.json({ error: 'This ad is already paid.' }, { status: 409 });

  const first = ads[0];
  const name = (body.name ?? first.name).trim().slice(0, AD_NAME_MAX);
  const tagline = (body.tagline ?? first.tagline).trim().slice(0, AD_TAGLINE_MAX);
  const description = (body.description ?? first.description ?? '').trim().slice(0, AD_DESCRIPTION_MAX);
  if (!name || !tagline) return NextResponse.json({ error: 'Name and headline are required.' }, { status: 400 });

  if (name !== first.name || tagline !== first.tagline || description !== (first.description ?? '')) {
    const moderation = await moderateAd({ url: first.url, name, tagline, about: description });
    await serviceClient.from('ad_slots' as any).update({ name, tagline, description, ...(moderation.ok ? {} : { status: 'blocked', moderation }) }).in('id', ids);
    if (!moderation.ok) {
      await notifyAdDiscord(`🚫 **Sponsor ad refused after edit** (${moderation.topic}): ${name} · "${tagline}" · ${first.url} by ${user.email}`);
      return NextResponse.json({ blocked: true }, { status: 409 });
    }
  }

  // Only the newsletter has a choice (monthly or one edition); everything else is monthly.
  const planFor = (kind: AdKind): AdPlan => (kind === 'newsletter' && isAdPlan(body.plans?.[kind]) ? (body.plans![kind] as AdPlan) : 'monthly');
  for (const a of ads) {
    a.plan = planFor(a.kind);
    await serviceClient.from('ad_slots' as any).update({ plan: a.plan }).eq('id', a.id);
  }

  const soldOut = [];
  for (const a of ads) if (!(await freeSlot(a.kind))) soldOut.push(AD_PRODUCTS[a.kind as AdKind].title);
  if (soldOut.length) return NextResponse.json({ error: `Sold out right now: ${soldOut.join(', ')}. Untick it to continue.` }, { status: 409 });

  try {
    const session = await createAdCheckout(ads.map(a => ({ id: a.id, kind: a.kind, plan: a.plan, name })), user, new URL(req.url).origin);
    await logPaymentEvent({ event: 'ad_checkout_created', stripeSessionId: session.id, userId: user.id, details: { ad_ids: ids, kinds: ads.map(a => `${a.kind}:${a.plan}`) } });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    await logPaymentEvent({ event: 'ad_checkout_error', level: 'error', userId: user.id, details: { ad_ids: ids, message: (err as Error).message } });
    return NextResponse.json({ error: 'Could not start the payment, please try again.' }, { status: 502 });
  }
}
