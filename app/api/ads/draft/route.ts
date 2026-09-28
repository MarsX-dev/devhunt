import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { draftAds, notifyAdDiscord } from '@/utils/server/ads';
import { importEnabled } from '@/utils/server/toolImport';
import { isAdKind } from '@/utils/ads';
import { tooManyRequests, withinLimit } from '@/utils/server/rateLimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

// Advertiser enters a URL: we write the ad and check it with JEV before they can pay.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await withinLimit(`ad-draft:${user.id}`, 10, 3600))) return tooManyRequests('Too many ad drafts, please try again in an hour.');
  if (!importEnabled()) return NextResponse.json({ error: 'Ad setup is not configured.' }, { status: 503 });

  const { url: raw, kinds: picked } = (await req.json().catch(() => ({}))) as { url?: string; kinds?: unknown[] };
  const kinds = Array.from(new Set((picked ?? []).filter(isAdKind)));
  if (!kinds.length) return NextResponse.json({ error: 'Pick at least one ad type.' }, { status: 400 });
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw ?? '') ? raw! : `https://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw new Error('bad url');
  } catch {
    return NextResponse.json({ error: 'Please enter a valid website URL.' }, { status: 400 });
  }

  try {
    const { ads, moderation } = await draftAds(user.id, url.toString(), kinds);
    const ad = ads[0];
    if (!moderation.ok) {
      await notifyAdDiscord(
        `🚫 **Sponsor ad refused** (${moderation.topic} in the ${moderation.on === 'site' ? 'website' : 'ad text'}, ${Math.round((moderation.probability ?? 0) * 100)}%): ${ad.name} · "${ad.tagline}" · ${ad.url} by ${user.email}. Wrong call? Flip ad_slots ${ads.map(a => `#${a.id}`).join(', ')} to 'draft'.`,
      );
      return NextResponse.json({ blocked: true });
    }
    await notifyAdDiscord(
      `✍️ Sponsor ad generated (${kinds.join(' + ')}): **${ad.name}** · "${ad.tagline}" · <${ad.url}> by ${user.email}${
        moderation.jev ? '' : ' · ❔ no JEV check (JEV unavailable)'
      }`,
    );
    return NextResponse.json({ ads });
  } catch (err) {
    console.error('ad draft failed:', url.hostname, (err as Error).message);
    return NextResponse.json({ error: "We couldn't read that website. Check the URL and try again." }, { status: 502 });
  }
}
