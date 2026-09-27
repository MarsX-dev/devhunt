'use client';

import { VISIT_KEY, seenBefore, visitState } from '@/utils/analytics';

// Page view beacons (components/Analytics). Next 14 syncs history.pushState/replaceState with the router,
// so the tool preview modal - which puts /tool/... in the URL when it opens and on every ←/→ step - also
// changes usePathname(). Those URLs are registered here and are not page views, and neither is closing the
// modal back to the page already counted.
let previewUrl: string | null = null;
let lastSent: string | null = null;
let pending: (() => void) | null = null;

export function setPreviewUrl(url: string | null) {
  previewUrl = url;
}

export function trackPageView(path: string, { force = false }: { force?: boolean } = {}) {
  if (typeof window === 'undefined' || navigator.webdriver) return;
  if (!force && (path === previewUrl || path === lastSent)) return;
  lastSent = path;
  pending?.(); // a newer page view replaces one not sent yet
  const send = () => {
    pending = null;
    let stored: string | null = null;
    let keys: string[] = [];
    try {
      stored = localStorage.getItem(VISIT_KEY);
      keys = Object.keys(localStorage);
    } catch {}
    const today = new Date().toISOString().slice(0, 10);
    const { newVisitor, newToday, next } = visitState(stored, today, seenBefore(document.cookie, keys));
    try {
      localStorage.setItem(VISIT_KEY, next);
    } catch {}
    const body = JSON.stringify({ p: path, n: newVisitor, d: newToday });
    if (!navigator.sendBeacon?.('/api/hit', new Blob([body], { type: 'text/plain' }))) {
      fetch('/api/hit', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }
  };
  const idle = (window as any).requestIdleCallback as ((cb: () => void, o?: object) => number) | undefined;
  const id = idle ? idle(send, { timeout: 3000 }) : window.setTimeout(send, 1000);
  pending = () => (idle ? (window as any).cancelIdleCallback(id) : clearTimeout(id));
}
