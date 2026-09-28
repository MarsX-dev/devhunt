import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { AD_DESCRIPTION_MAX, AD_NAME_MAX, AD_TAGLINE_MAX, adImage, adUrl, moderateAdEdit, notifyAdDiscord, refreshAdPages } from '@/utils/server/ads';
import { tooManyRequests, withinLimit } from '@/utils/server/rateLimit';
import { trackFunnel } from '@/utils/server/funnel';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const EDITABLE = ['active', 'canceling'];

// Advertiser edits a running ad (and the ads bought with it, which share the copy). Every change is
// checked by JEV first, a new link by what its page says: if it looks like a banned topic (fraud,
// crypto, gambling, adult) or can't be checked, the edit is refused, the old ad keeps running, and
// the team gets a Discord alert.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await withinLimit(`ad-edit:${user.id}`, 20, 3600))) return tooManyRequests('Too many edits, please try again in an hour.');

  const body = (await req.json().catch(() => ({}))) as {
    adId?: number;
    name?: string;
    tagline?: string;
    description?: string;
    url?: string;
    logoUrl?: string | null;
    imageUrl?: string | null;
  };
  const { data } = await serviceClient
    .from('ad_slots' as any)
    .select('id, kind, user_id, status, name, tagline, description, url, logo_url, image_url, stripe_subscription_id')
    .eq('id', Number(body.adId))
    .maybeSingle();
  const ad = data as any;
  if (!ad || ad.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!EDITABLE.includes(ad.status)) return NextResponse.json({ error: 'Only running ads can be edited.' }, { status: 409 });

  // Ads bought in one checkout share a subscription and their copy: edit them together.
  let ids = [ad.id as number];
  if (ad.stripe_subscription_id) {
    const { data: group } = await serviceClient.from('ad_slots' as any).select('id').eq('stripe_subscription_id', ad.stripe_subscription_id).in('status', EDITABLE);
    ids = ((group ?? []) as any[]).map(g => g.id as number);
  }

  const name = (body.name ?? ad.name).trim().slice(0, AD_NAME_MAX);
  const tagline = (body.tagline ?? ad.tagline).trim().slice(0, AD_TAGLINE_MAX);
  const description = (body.description ?? ad.description ?? '').trim().slice(0, AD_DESCRIPTION_MAX);
  if (!name || !tagline) return NextResponse.json({ error: 'Name and headline are required.' }, { status: 400 });
  const url = body.url === undefined ? ad.url : adUrl(body.url);
  if (!url) return NextResponse.json({ error: 'Please enter a valid link (https://...).' }, { status: 400 });
  const logo_url = body.logoUrl === undefined ? ad.logo_url : adImage(body.logoUrl, ad.logo_url);
  const image_url = body.imageUrl === undefined ? ad.image_url : adImage(body.imageUrl, ad.image_url);
  if (logo_url === false || image_url === false) return NextResponse.json({ error: 'Please upload the image again.' }, { status: 400 });

  const textChanged = name !== ad.name || tagline !== ad.tagline || description !== (ad.description ?? '') || url !== ad.url;
  const imagesChanged = logo_url !== ad.logo_url || image_url !== ad.image_url;
  if (!textChanged && !imagesChanged) return NextResponse.json({ ok: true, unchanged: true });

  const before = `${ad.name} · "${ad.tagline}" · <${ad.url}>`;
  const after = `${name} · "${tagline}" · <${url}>`;
  const moderation = await moderateAdEdit({ url, name, tagline, description }, ad.url);
  if (!moderation.ok || !moderation.jev) {
    const why =
      moderation.topic === 'unreadable'
        ? "couldn't read the new link"
        : !moderation.jev
          ? 'JEV unavailable, could not check it'
          : `${moderation.topic} in the ${moderation.on === 'site' ? 'website' : 'ad text'}, ${Math.round((moderation.probability ?? 0) * 100)}%`;
    await notifyAdDiscord(`🚫 **Live sponsor ad edit refused** (${why}) by ${user.email}, ad #${ids.join(', #')} keeps its old copy.\nBefore: ${before}\nAttempted: ${after}`);
    await trackFunnel({ step: 'ad_edit_refused', userId: user.id, props: { name, url, topic: moderation.topic ?? 'unchecked' } });
    console.log(JSON.stringify({ event: 'ad_edit_refused', ads: ids, user: user.id, topic: moderation.topic, probability: moderation.probability, url }));
    const error =
      moderation.topic === 'unreadable'
        ? "We couldn't open that link. Check it and try again."
        : !moderation.jev
          ? "We couldn't check your changes right now. Please try again in a few minutes."
          : "We can't accept this change: DevHunt doesn't run ads for crypto, gambling, adult content or anything that looks deceptive. Your ad keeps running as it was. If you think this is a mistake, email john@marsx.dev.";
    return NextResponse.json({ error, refused: moderation.jev && moderation.topic !== 'unreadable' }, { status: 422 });
  }

  const { error } = await serviceClient.from('ad_slots' as any).update({ name, tagline, description, url, logo_url, image_url }).in('id', ids);
  if (error) return NextResponse.json({ error: 'Could not save, please try again.' }, { status: 500 });
  refreshAdPages();
  await trackFunnel({ step: 'ad_edited', userId: user.id, props: { name, url, images_changed: imagesChanged } });
  // Images aren't checked by JEV (text only): let the team eyeball them.
  await notifyAdDiscord(
    `✏️ Live sponsor ad edited by ${user.email} (ad #${ids.join(', #')})${imagesChanged ? ' · 🖼️ images changed, please glance at them' : ''}\nBefore: ${before}\nNow: ${after}${
      imagesChanged ? `\n${[logo_url && `logo <${logo_url}>`, image_url && `image <${image_url}>`].filter(Boolean).join(' · ')}` : ''
    }`,
  );
  return NextResponse.json({ ok: true });
}
