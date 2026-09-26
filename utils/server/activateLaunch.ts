import type Stripe from 'stripe';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { isCheckoutPaid, resolvePaidWeek, type PlannedWeek } from '@/utils/launchPlanning';
import { getUpcomingWeeks } from '@/utils/server/launchWeeks';

export type ActivationResult =
  | { status: 'activated' | 'already-activated'; productId: number; launchStart: string }
  | { status: 'not-paid' | 'invalid' };

// Marks the product in a completed Checkout Session as paid and moves it to its paid week.
// Idempotent: the payments row (unique session id) is inserted first; a duplicate means it was
// already handled by the webhook or the success page.
export async function activateFromCheckoutSession(session: Stripe.Checkout.Session): Promise<ActivationResult> {
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

  const { error: updateError } = await serviceClient
    .from('products')
    .update({
      isPaid: true,
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
