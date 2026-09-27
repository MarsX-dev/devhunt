import { NextResponse } from 'next/server';
import { AD_SLOTS, LIVE_STATUSES, withRef, type PublicAd } from '@/utils/ads';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// Live sponsor ads for the rails. Served from the CDN (one DB read per minute, not per visitor).
export const revalidate = 60;

export async function GET() {
  const { data } = await serviceClient
    .from('ad_slots' as any)
    .select('kind, slot, name, tagline, url, logo_url, status, current_period_end')
    .in('status', LIVE_STATUSES as any)
    .in('kind', ['rail', 'inline'])
    .order('slot');
  const ads: (PublicAd & { freeFrom: string | null })[] = ((data ?? []) as any[]).map(r => ({
    kind: r.kind,
    slot: r.slot,
    name: r.name,
    tagline: r.tagline,
    url: withRef(r.url),
    logo_url: r.logo_url,
    // A canceled ad runs out on this date; the slot shows "free from ..." next to it.
    freeFrom: r.status === 'canceling' ? r.current_period_end : null,
  }));
  return NextResponse.json({ ads, total: AD_SLOTS }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
}
