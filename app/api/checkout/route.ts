import { NextResponse } from 'next/server';
import { weekKey } from '@/utils/launchWeeks';
import { resolvePaidWeek, type PlannedWeek } from '@/utils/launchPlanning';
import { getRouteUser } from '@/utils/server/auth';
import { requestContext, trackFunnel } from '@/utils/server/funnel';
import { getUpcomingWeeks } from '@/utils/server/launchWeeks';
import { LAUNCH_PRICE_ID, stripe } from '@/utils/server/stripe';
import { hasRegionalPrice, isLaunchTier, launchPrice } from '@/utils/launchTiers';
import { logPaymentEvent } from '@/utils/server/paymentLog';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Starts a Stripe Checkout for a paid launch of the caller's own tool in the chosen week, as a
// boosted ($49, default) or basic ($19) launch. Visitors from non-high-income countries (Vercel geo
// header, set by the edge, not the browser) pay the regional price: $29 / $9.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId, week, tier: rawTier } = (await req.json().catch(() => ({}))) as { productId?: number; week?: string; tier?: string };
  const tier = isLaunchTier(rawTier) ? rawTier : 'boost';
  const { data: product } = await serviceClient
    .from('products')
    .select('id, slug, name, owner_id, isPaid, paid_launch_date, deleted')
    .eq('id', Number(productId))
    .single();
  if (!product || product.deleted || product.owner_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (product.isPaid) return NextResponse.json({ error: 'This launch is already paid.' }, { status: 409 });

  const weeks = await getUpcomingWeeks(104);
  const chosen = week ? weeks.find(w => weekKey(w.startDate) === week) : undefined;
  if (week && (!chosen || new Date(chosen.startDate) <= new Date())) {
    return NextResponse.json({ error: 'Please pick an upcoming launch week.' }, { status: 400 });
  }
  const target = chosen
    ? { week: chosen.week, startDate: new Date(chosen.startDate).toISOString(), endDate: new Date(chosen.endDate).toISOString() }
    : resolvePaidWeek(product.paid_launch_date as PlannedWeek | null, weeks);
  if (!target) return NextResponse.json({ error: 'No upcoming launch weeks available.' }, { status: 400 });

  const { country } = requestContext();
  const regional = hasRegionalPrice(country);
  const origin = new URL(req.url).origin;
  let session;
  try {
    session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        tier === 'boost' && !regional
          ? { price: LAUNCH_PRICE_ID, quantity: 1 }
          : { price_data: { currency: 'usd', unit_amount: launchPrice(tier, regional) * 100, product_data: { name: `DevHunt launch: ${product.name}` } }, quantity: 1 },
      ],
      allow_promotion_codes: true,
      // Local-currency pricing (Adaptive Pricing) makes Checkout reject promotion codes, so charge in USD.
      adaptive_pricing: { enabled: false },
      customer_email: user.email ?? undefined,
      client_reference_id: String(product.id),
      metadata: {
        product_id: String(product.id),
        user_id: user.id,
        tier,
        country: country ?? '',
        regional: regional ? '1' : '',
        week: String(target.week),
        week_start: target.startDate,
        week_end: target.endDate,
        // Funnel ids, so the webhook's paid/failed steps join this visitor's journey.
        ...(() => {
          const ctx = requestContext();
          return { visitor_id: ctx.visitorId ?? '', session_id: ctx.sessionId ?? '' };
        })(),
      },
      // No payment_intent_data: it makes Checkout require a card, so 100%-off codes are rejected.
      success_url: `${origin}/account/tools/activate-launch/${product.slug}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/account/tools/activate-launch/${product.slug}?canceled=1`,
    });
  } catch (err) {
    await logPaymentEvent({
      event: 'checkout_error',
      level: 'error',
      productId: product.id,
      userId: user.id,
      details: { message: (err as Error).message },
    });
    await trackFunnel({ step: 'payment_failed', userId: user.id, productId: product.id, props: { error: `checkout did not start: ${(err as Error).message}` } });
    return NextResponse.json({ error: 'Could not start the payment, please try again.' }, { status: 502 });
  }

  await logPaymentEvent({
    event: 'checkout_created',
    stripeSessionId: session.id,
    productId: product.id,
    userId: user.id,
    amountTotal: session.amount_total,
    currency: session.currency,
    details: { week: target.week, week_start: target.startDate, tool: product.slug, tier, country, regional },
  });
  await trackFunnel({
    step: 'checkout_started',
    userId: user.id,
    productId: product.id,
    props: { week: target.startDate, amount: (session.amount_total ?? 0) / 100, currency: session.currency ?? undefined, stripe_session: session.id, tool: product.slug, tier, regional },
  });
  return NextResponse.json({ url: session.url });
}
