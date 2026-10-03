'use client';

import { SESSION_COOKIE, VISITOR_COOKIE, type FunnelStep } from '@/utils/funnel';

const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(36).padStart(2, '0')).join('').slice(0, 20);
const readCookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? null;

// First-party ids that tie a visitor's funnel steps together (also sent to the server as cookies,
// so steps recorded by API routes join the same journey). The visitor id lasts a year, the session
// id until the browser closes.
export function funnelIds() {
  let vid = readCookie(VISITOR_COOKIE);
  if (!vid) {
    vid = randomId();
    document.cookie = `${VISITOR_COOKIE}=${vid}; path=/; max-age=31536000; samesite=lax`;
  }
  let sid = readCookie(SESSION_COOKIE);
  if (!sid) {
    sid = randomId();
    document.cookie = `${SESSION_COOKIE}=${sid}; path=/; samesite=lax`;
  }
  return { vid, sid };
}

// Records a funnel step from the browser (fire and forget).
export function trackStep(step: FunnelStep, props: Record<string, unknown> = {}, productId?: number) {
  try {
    if (navigator.webdriver && !(window as any).__DH_TRACK_IN_TESTS) return;
    const { vid, sid } = funnelIds();
    const params = Object.fromEntries(new URLSearchParams(location.search));
    const body = JSON.stringify({ step, props, productId, vid, sid, ref: document.referrer || null, utm: params, path: location.pathname });
    if (!navigator.sendBeacon?.('/api/funnel', new Blob([body], { type: 'text/plain' }))) {
      void fetch('/api/funnel', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch {}
}
