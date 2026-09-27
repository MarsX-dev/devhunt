import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { stripe } from '@/utils/server/stripe';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// The advertise page: the caller's ads and their payment history (straight from Stripe).
export async function GET() {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await serviceClient
    .from('ad_slots' as any)
    .select('id, slot, url, name, tagline, logo_url, status, current_period_end, started_at, canceled_at, created_at, stripe_subscription_id')
    .eq('user_id', user.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false });
  const ads = (data ?? []) as any[];

  const payments = (
    await Promise.all(
      ads
        .filter(a => a.stripe_subscription_id)
        .map(a =>
          stripe()
            .invoices.list({ subscription: a.stripe_subscription_id, limit: 24 })
            .then(r => r.data.map(inv => ({ id: inv.id, ad: a.name, amount: inv.amount_paid / 100, currency: inv.currency, status: inv.status, date: new Date(inv.created * 1000).toISOString() })))
            .catch(() => []),
        ),
    )
  )
    .flat()
    .sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ ads: ads.map(({ stripe_subscription_id, ...a }) => a), payments });
}
