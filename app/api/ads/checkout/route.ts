import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { AD_DESCRIPTION_MAX, AD_NAME_MAX, AD_TAGLINE_MAX, adImage, adUrl, createAdCheckout, freeSlot, moderateAdEdit, notifyAdDiscord } from '@/utils/server/ads';
import { AD_PRODUCTS, planPrice, weeklyPlan, type AdKind, type AdPlan } from '@/utils/ads';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { logModeration } from '@/utils/server/moderationLog';
import { trackFunnel } from '@/utils/server/funnel';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Saves the advertiser's edits to their drafts (one per ad type picked), re-checks edited copy, and
// starts one checkout covering all of them (weekly one-time items and/or one monthly subscription).
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    adIds?: number[];
    name?: string;
    tagline?: string;
    description?: string;
    url?: string;
    logoUrl?: string | null;
    imageUrl?: string | null;
    plans?: Record<string, unknown>;
  };
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
  const url = body.url === undefined ? first.url : adUrl(body.url);
  if (!url) return NextResponse.json({ error: 'Please enter a valid link (https://...).' }, { status: 400 });
  // Images: unchanged, removed, or uploaded through our image host.
  const logo_url = body.logoUrl === undefined ? first.logo_url : adImage(body.logoUrl, first.logo_url);
  const image_url = body.imageUrl === undefined ? first.image_url : adImage(body.imageUrl, first.image_url);
  if (logo_url === false || image_url === false) return NextResponse.json({ error: 'Please upload the image again.' }, { status: 400 });
  if (logo_url !== first.logo_url || image_url !== first.image_url) await serviceClient.from('ad_slots' as any).update({ logo_url, image_url }).in('id', ids);

  // Checked again when the copy or link changed, or when JEV couldn't check it at generation: nothing
  // goes live without a JEV check.
  const changed = name !== first.name || tagline !== first.tagline || description !== (first.description ?? '') || url !== first.url;
  if (changed || !first.moderation?.jev) {
    const moderation = await moderateAdEdit({ url, name, tagline, description }, changed ? first.url : url);
    if (moderation.topic === 'unreadable') return NextResponse.json({ error: "We couldn't open that link. Check it and try again." }, { status: 400 });
    if (!moderation.jev) {
      await notifyAdDiscord(`❔ Sponsor ad checkout paused, JEV unavailable: ${name} · <${url}> by ${user.email}`);
      return NextResponse.json({ error: "We couldn't check your ad right now. Please try again in a few minutes." }, { status: 503 });
    }
    await serviceClient.from('ad_slots' as any).update({ name, tagline, description, url, moderation, ...(moderation.ok ? {} : { status: 'blocked' }) }).in('id', ids);
    if (!moderation.ok) {
      await logModeration({ kind: 'ad', action: 'refused', reason: `${moderation.topic} (${moderation.on === 'site' ? 'website' : 'ad text'}, at checkout)`, subject: name, url, userId: user.id, score: moderation.probability, details: { tagline } });
      await notifyAdDiscord(`🚫 **Sponsor ad refused at checkout** (${moderation.topic} in the ${moderation.on === 'site' ? 'website' : 'ad text'}): ${name} · "${tagline}" · <${url}> by ${user.email}`);
      return NextResponse.json({ blocked: true }, { status: 409 });
    }
  }

  // Each product is bought for a week (the default) or monthly.
  const planFor = (kind: AdKind): AdPlan => (body.plans?.[kind] === 'monthly' ? 'monthly' : weeklyPlan(kind));
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
    await trackFunnel({
      step: 'ad_checkout_started',
      userId: user.id,
      props: { name, kinds: ads.map(a => a.kind), amount: ads.reduce((sum, a) => sum + planPrice(a.kind, a.plan), 0) },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    await logPaymentEvent({ event: 'ad_checkout_error', level: 'error', userId: user.id, details: { ad_ids: ids, message: (err as Error).message } });
    return NextResponse.json({ error: 'Could not start the payment, please try again.' }, { status: 502 });
  }
}
