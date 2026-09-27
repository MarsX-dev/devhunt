import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { draftAd, notifyAdDiscord } from '@/utils/server/ads';
import { importEnabled } from '@/utils/server/toolImport';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

// Advertiser enters a URL: we write the ad and check it with JEV before they can pay.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!importEnabled()) return NextResponse.json({ error: 'Ad setup is not configured.' }, { status: 503 });

  const { url: raw } = (await req.json().catch(() => ({}))) as { url?: string };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw ?? '') ? raw! : `https://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw new Error('bad url');
  } catch {
    return NextResponse.json({ error: 'Please enter a valid website URL.' }, { status: 400 });
  }

  try {
    const { ad, moderation } = await draftAd(user.id, url.toString());
    if (!moderation.ok) {
      await notifyAdDiscord(
        `🚫 **Sponsor ad refused** (${moderation.topic}, ${Math.round((moderation.probability ?? 0) * 100)}%): ${ad.name} · "${ad.tagline}" · ${ad.url} by ${user.email}. Wrong call? Flip ad_slots #${ad.id} to 'draft'.`,
      );
      return NextResponse.json({ blocked: true, ad });
    }
    if (!moderation.jev) await notifyAdDiscord(`❔ Sponsor ad drafted without a JEV check (JEV unavailable): ${ad.name} · ${ad.url}`);
    return NextResponse.json({ ad });
  } catch (err) {
    console.error('ad draft failed:', url.hostname, (err as Error).message);
    return NextResponse.json({ error: "We couldn't read that website. Check the URL and try again." }, { status: 502 });
  }
}
