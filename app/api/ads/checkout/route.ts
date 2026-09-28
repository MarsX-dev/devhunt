import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { AD_DESCRIPTION_MAX, AD_NAME_MAX, AD_TAGLINE_MAX, createAdCheckout, freeSlot, moderateAd, notifyAdDiscord } from '@/utils/server/ads';
import { AD_PRODUCTS, isAdPlan, type AdKind, type AdPlan } from '@/utils/ads';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

const IMAGE_HOSTS = ['mars-images.imgix.net', 'marscode.s3.eu-north-1.amazonaws.com'];

// http(s) link with a real hostname, or null.
function adUrl(raw: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    return ['http:', 'https:'].includes(u.protocol) && u.hostname.includes('.') ? u.toString() : null;
  } catch {
    return null;
  }
}

// The stored image, null (removed), or a new upload on our image host; false for anything else.
function adImage(value: string | null, stored: string | null): string | null | false {
  if (!value) return null;
  if (value === stored) return stored;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && IMAGE_HOSTS.includes(u.hostname) ? value : false;
  } catch {
    return false;
  }
}

// Saves the advertiser's edits to their drafts (one per ad type picked), re-checks edited copy, and
// starts one monthly subscription covering all of them.
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

  if (name !== first.name || tagline !== first.tagline || description !== (first.description ?? '') || url !== first.url) {
    const moderation = await moderateAd({ url, name, tagline, about: description });
    await serviceClient.from('ad_slots' as any).update({ name, tagline, description, url, ...(moderation.ok ? {} : { status: 'blocked', moderation }) }).in('id', ids);
    if (!moderation.ok) {
      await notifyAdDiscord(`🚫 **Sponsor ad refused after edit** (${moderation.topic}): ${name} · "${tagline}" · ${url} by ${user.email}`);
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
