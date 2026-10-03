import Stripe from 'stripe';

// $49 "DevHunt launch: skip the queue" price in the DevHunt Stripe account. Not a secret.
export const LAUNCH_PRICE_ID = process.env.STRIPE_LAUNCH_PRICE_ID ?? 'price_1UK2y3BpCLVWiyCv71OgBqJa';

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  client ??= new Stripe(key);
  return client;
}
