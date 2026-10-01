import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export interface PaymentEvent {
  event: string;
  level?: 'info' | 'warn' | 'error';
  stripeSessionId?: string | null;
  stripeEventId?: string | null;
  productId?: number | null;
  userId?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  details?: Record<string, unknown>;
}

// Records a step of the paid-launch flow: one JSON line in the Vercel logs ("[payments]") and a row in
// payment_events (kept long-term for analysis). Never throws: logging must not break a payment.
export async function logPaymentEvent(e: PaymentEvent) {
  const row = {
    event: e.event,
    level: e.level ?? 'info',
    stripe_session_id: e.stripeSessionId ?? null,
    stripe_event_id: e.stripeEventId ?? null,
    product_id: e.productId ?? null,
    user_id: e.userId ?? null,
    amount_total: e.amountTotal ?? null,
    currency: e.currency ?? null,
    details: e.details ?? {},
  };
  const line = `[payments] ${JSON.stringify(row)}`;
  if (row.level === 'error') console.error(line);
  else if (row.level === 'warn') console.warn(line);
  else console.log(line);
  const { error } = await serviceClient.from('payment_events').insert(row);
  if (error) console.error(`[payments] could not store event: ${error.message}`);
}

const money = (amount?: number | null, currency?: string | null) =>
  amount == null ? '' : `${(amount / 100).toFixed(2)} ${(currency ?? 'usd').toUpperCase()}`;

// Posts a payment notification to the Discord channel in DISCORD_PAYMENTS_WEBHOOK.
export async function notifyPaymentDiscord(kind: 'paid' | 'failed', info: { toolName?: string | null; toolSlug?: string | null; email?: string | null; amount?: number | null; currency?: string | null; reason?: string; launchStart?: string | null; tier?: string }) {
  const webhook = process.env.DISCORD_PAYMENTS_WEBHOOK;
  if (!webhook) return;
  const tool = info.toolSlug ? `[${info.toolName ?? info.toolSlug}](https://devhunt.org/tool/${info.toolSlug})` : info.toolName ?? 'unknown tool';
  const content =
    kind === 'paid'
      ? `✅ **Paid launch** ${money(info.amount, info.currency)}${info.tier ? ` (${info.tier})` : ''}: ${tool}${info.email ? ` by ${info.email}` : ''}${info.launchStart ? `, launches ${info.launchStart.slice(0, 10)}` : ''}`
      : `❌ **Payment failed** ${money(info.amount, info.currency)}: ${tool}${info.email ? ` by ${info.email}` : ''}${info.reason ? ` (${info.reason})` : ''}`;
  await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, allowed_mentions: { parse: [] } }) }).catch(err =>
    console.error(`[payments] discord notify failed: ${(err as Error).message}`),
  );
}
