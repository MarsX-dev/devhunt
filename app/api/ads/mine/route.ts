import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { stripe } from '@/utils/server/stripe';
import { availability, refundableUntil } from '@/utils/server/ads';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// The advertise page: the caller's ads and their payment history (straight from Stripe).
export async function GET() {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await serviceClient
    .from('ad_slots' as any)
    .select('id, kind, slot, url, name, tagline, description, logo_url, image_url, refunded_at, status, current_period_end, started_at, canceled_at, created_at, stripe_subscription_id')
    .eq('user_id', user.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false });
  const ads = (data ?? []) as any[];

  const payments = (
    await Promise.all(
      // One subscription can cover several ads (bought together): list its invoices once.
      Array.from(new Set(ads.map(a => a.stripe_subscription_id).filter(Boolean))).map(subId => {
        const covered = ads.filter(a => a.stripe_subscription_id === subId);
        const label = `${covered[0].name}: ${covered.map(a => a.kind).join(' + ')}`;
        return stripe()
          .invoices.list({ subscription: subId, limit: 24 })
          .then(r => r.data.map(inv => ({ id: inv.id, ad: label, amount: inv.amount_paid / 100, currency: inv.currency, status: inv.status, date: new Date(inv.created * 1000).toISOString() })))
          .catch(() => []);
      }),
    )
  )
    .flat()
    .sort((a, b) => b.date.localeCompare(a.date));

  const liveSubs = Array.from(new Set(ads.filter(a => a.stripe_subscription_id && ['active', 'canceling'].includes(a.status)).map(a => a.stripe_subscription_id)));
  const windows = await Promise.all(liveSubs.map(refundableUntil));
  const refundable = Object.fromEntries(liveSubs.map((id, i) => [id, windows[i]]));
  // Ads bought together share a group (the subscription); cancel/refund act on the group.
  const groups = Object.fromEntries(Array.from(new Set(ads.map(a => a.stripe_subscription_id).filter(Boolean))).map((id, i) => [id, i + 1]));
  const free = await availability();
  return NextResponse.json({
    ads: ads.map(({ stripe_subscription_id: sub, ...a }) => ({ ...a, group: sub ? groups[sub] : null, refundable_until: sub ? refundable[sub] ?? null : null })),
    payments,
    free,
  });
}
