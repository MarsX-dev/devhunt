import { cookies, headers } from 'next/headers';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { SESSION_COOKIE, VISITOR_COOKIE, cleanId, cleanProps, deviceFrom, type FunnelStep } from '@/utils/funnel';
import { countryCode } from '@/utils/analytics';

export interface FunnelEvent {
  step: FunnelStep;
  userId?: string | null;
  productId?: number | null;
  props?: Record<string, unknown>;
  visitorId?: string | null; // defaults to the dh_vid cookie of the current request
  sessionId?: string | null;
  referrer?: string | null;
  utm?: Record<string, string> | null;
  country?: string | null;
  device?: string | null;
}

// The browser ids and geo of the current request, when called inside a route handler.
export function requestContext() {
  try {
    const c = cookies();
    const h = headers();
    return {
      visitorId: cleanId(c.get(VISITOR_COOKIE)?.value),
      sessionId: cleanId(c.get(SESSION_COOKIE)?.value),
      country: countryCode(h.get('x-vercel-ip-country')),
      device: deviceFrom(h.get('user-agent')),
    };
  } catch {
    return { visitorId: null, sessionId: null, country: null, device: null };
  }
}

// Records one funnel step. Never throws: analytics must not break the flow it measures.
export async function trackFunnel(event: FunnelEvent) {
  try {
    const ctx = event.visitorId === undefined ? requestContext() : { visitorId: null, sessionId: null, country: null, device: null };
    const { error } = await serviceClient.from('funnel_events' as never).insert({
      step: event.step,
      visitor_id: event.visitorId ?? ctx.visitorId,
      session_id: event.sessionId ?? ctx.sessionId,
      user_id: event.userId ?? null,
      product_id: event.productId ?? null,
      country: event.country ?? ctx.country,
      device: event.device ?? ctx.device,
      referrer: event.referrer ?? null,
      utm: event.utm ?? null,
      props: cleanProps(event.props ?? {}),
    } as never);
    if (error) console.error('funnel event failed:', event.step, error.message);
  } catch (err) {
    console.error('funnel event failed:', event.step, (err as Error).message);
  }
}
