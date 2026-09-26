import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { activateFromCheckoutSession } from '@/utils/server/activateLaunch';
import { logPaymentEvent, notifyPaymentDiscord } from '@/utils/server/paymentLog';
import { stripe } from '@/utils/server/stripe';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Tool name/slug for Discord messages.
async function toolFor(productId?: string | null) {
  if (!productId) return null;
  const { data } = await serviceClient.from('products').select('name, slug').eq('id', Number(productId)).single();
  return data;
}

// Reports a failed or abandoned payment (log + Discord).
async function reportFailure(event: Stripe.Event, session: Stripe.Checkout.Session | null, reason: string, extra: Record<string, unknown> = {}) {
  await logPaymentEvent({
    event: 'payment_failed',
    level: 'warn',
    stripeEventId: event.id,
    stripeSessionId: session?.id,
    productId: Number(session?.metadata?.product_id) || null,
    userId: session?.metadata?.user_id ?? null,
    amountTotal: session?.amount_total,
    currency: session?.currency,
    details: { type: event.type, reason, ...extra },
  });
  const tool = await toolFor(session?.metadata?.product_id);
  await notifyPaymentDiscord('failed', {
    toolName: tool?.name,
    toolSlug: tool?.slug,
    email: session?.customer_details?.email ?? session?.customer_email,
    amount: session?.amount_total,
    currency: session?.currency,
    reason,
  });
}

// Stripe webhook: activates paid launches and reports failures. The signature is verified with
// STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!secret || !signature) {
    await logPaymentEvent({ event: 'webhook_rejected', level: 'warn', details: { reason: secret ? 'missing signature' : 'STRIPE_WEBHOOK_SECRET not set' } });
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    await logPaymentEvent({ event: 'webhook_rejected', level: 'warn', details: { reason: 'invalid signature', message: (err as Error).message } });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const object = event.data.object as { id?: string };
  await logPaymentEvent({ event: 'webhook_received', stripeEventId: event.id, stripeSessionId: object.id?.startsWith('cs_') ? object.id : null, details: { type: event.type } });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await activateFromCheckoutSession(event.data.object as Stripe.Checkout.Session, 'webhook', event.id);
        break;
      case 'checkout.session.async_payment_failed':
        await reportFailure(event, event.data.object as Stripe.Checkout.Session, 'delayed payment failed');
        break;
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Sessions we expire ourselves (tests, replaced checkouts) have no DevHunt tool attached.
        if (session.metadata?.product_id) await reportFailure(event, session, 'checkout abandoned (expired unpaid)');
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const sessions = await stripe().checkout.sessions.list({ payment_intent: intent.id, limit: 1 });
        await reportFailure(event, sessions.data[0] ?? null, intent.last_payment_error?.message ?? 'card payment failed', {
          decline_code: intent.last_payment_error?.decline_code,
          code: intent.last_payment_error?.code,
        });
        break;
      }
    }
  } catch (err) {
    await logPaymentEvent({ event: 'webhook_error', level: 'error', stripeEventId: event.id, details: { type: event.type, message: (err as Error).message } });
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 }); // Stripe retries
  }
  return NextResponse.json({ received: true });
}
