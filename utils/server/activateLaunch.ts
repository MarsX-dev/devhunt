import { trackFunnel } from '@/utils/server/funnel';
import type Stripe from 'stripe';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { isCheckoutPaid, resolvePaidWeek, type PlannedWeek } from '@/utils/launchPlanning';
import { getUpcomingWeeks } from '@/utils/server/launchWeeks';
import { logPaymentEvent, notifyPaymentDiscord } from '@/utils/server/paymentLog';
import { LAUNCH_TIERS, isLaunchTier } from '@/utils/launchTiers';

export type ActivationResult =
  | { status: 'activated' | 'already-activated'; productId: number; launchStart: string }
  | { status: 'not-paid' | 'invalid' };

// Marks the product in a completed Checkout Session as paid and moves it to its paid week.
// Idempotent: the payments row (unique session id) is inserted first; a duplicate means it was
// already handled by the webhook or the success page.
export async function activateFromCheckoutSession(session: Stripe.Checkout.Session, source: 'webhook' | 'confirm', stripeEventId?: string): Promise<ActivationResult> {
  const base = {
    stripeSessionId: session.id,
    stripeEventId,
    productId: Number(session.metadata?.product_id) || null,
    userId: session.metadata?.user_id ?? null,
    amountTotal: session.amount_total,
    currency: session.currency,
  };
  try {
    const result = await activate(session);
    await logPaymentEvent({
      ...base,
      event: `activation_${result.status}`,
      level: result.status === 'invalid' ? 'warn' : 'info',
      details: { source, status: session.status, payment_status: session.payment_status, week_start: session.metadata?.week_start, ...(result.status === 'activated' || result.status === 'already-activated' ? { launchStart: result.launchStart } : {}) },
    });
    if (result.status === 'activated') {
      await trackFunnel({
        step: 'paid',
        userId: base.userId,
        productId: result.productId,
        visitorId: session.metadata?.visitor_id || null,
        sessionId: session.metadata?.session_id || null,
        props: { amount: (session.amount_total ?? 0) / 100, currency: session.currency ?? undefined, week: session.metadata?.week_start, via: source, tier: session.metadata?.tier ?? 'boost', promo: !!session.total_details?.amount_discount },
      });
      const { data: tool } = await serviceClient.from('products').select('name, slug').eq('id', result.productId).single();
      await notifyPaymentDiscord('paid', {
        toolName: tool?.name,
        toolSlug: tool?.slug,
        email: session.customer_details?.email ?? session.customer_email,
        amount: session.amount_total,
        currency: session.currency,
        launchStart: result.launchStart,
        tier: session.metadata?.tier === 'basic' ? '$19, no tweet' : '$49 boost',
      });
    }
    return result;
  } catch (err) {
    await logPaymentEvent({ ...base, event: 'activation_error', level: 'error', details: { source, message: (err as Error).message } });
    throw err;
  }
}

async function activate(session: Stripe.Checkout.Session): Promise<ActivationResult> {
  if (!isCheckoutPaid(session)) return { status: 'not-paid' };

  const productId = Number(session.metadata?.product_id);
  const userId = session.metadata?.user_id;
  if (!productId || !userId) return { status: 'invalid' };

  const { data: product } = await serviceClient
    .from('products')
    .select('id, owner_id, isPaid, paid_launch_date, launch_start')
    .eq('id', productId)
    .single();
  if (!product || product.owner_id !== userId) return { status: 'invalid' };

  const requested: PlannedWeek | null = session.metadata?.week_start
    ? { week: Number(session.metadata.week), startDate: session.metadata.week_start, endDate: session.metadata.week_end ?? '' }
    : (product.paid_launch_date as PlannedWeek | null);
  const target = resolvePaidWeek(requested?.endDate ? requested : null, await getUpcomingWeeks(60));
  if (!target) return { status: 'invalid' };

  const { error: insertError } = await serviceClient.from('payments').insert({
    stripe_session_id: session.id,
    stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
    product_id: productId,
    user_id: userId,
    amount_total: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    payment_status: session.payment_status,
    launch_week_start: target.startDate,
  });
  if (insertError) {
    // 23505 = unique violation: this session was already activated.
    if (insertError.code === '23505') return { status: 'already-activated', productId, launchStart: product.launch_start as string };
    throw new Error(`payments insert failed: ${insertError.message}`);
  }

  const metaTier = session.metadata?.tier;
  const tier = isLaunchTier(metaTier) ? metaTier : 'boost'; // sessions before tiers were all $49
  const { error: updateError } = await serviceClient
    .from('products')
    .update({
      isPaid: true,
      launch_tier: LAUNCH_TIERS[tier].rank,
      paid_launch_date: target,
      launch_date: target.startDate,
      launch_start: target.startDate,
      launch_end: target.endDate,
      week: target.week,
    })
    .eq('id', productId);
  if (updateError) throw new Error(`product activation failed: ${updateError.message}`);

  return { status: 'activated', productId, launchStart: target.startDate };
}
