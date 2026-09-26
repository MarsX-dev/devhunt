import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { activateFromCheckoutSession } from '@/utils/server/activateLaunch';
import { stripe } from '@/utils/server/stripe';

export const dynamic = 'force-dynamic';

// Stripe webhook: activates paid launches. The signature is verified with STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!secret || !signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const result = await activateFromCheckoutSession(event.data.object as Stripe.Checkout.Session);
    console.log(`stripe webhook ${event.type} ${event.id}: ${result.status}`);
  }
  return NextResponse.json({ received: true });
}
