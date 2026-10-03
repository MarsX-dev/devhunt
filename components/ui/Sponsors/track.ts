'use client';

import { useEffect, type RefObject } from 'react';
import { usePathname } from 'next/navigation';

// Sponsor impressions: an ad counts once per page view when at least half of it is on screen.
// Seen ids are batched into one beacon per page view (/api/ads/impression), not one call per ad.
let seen = new Set<number>();
let queued: number[] = [];
let page = '';
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  timer = null;
  if (!queued.length) return;
  const body = JSON.stringify({ ids: queued });
  queued = [];
  if (!navigator.sendBeacon?.('/api/ads/impression', new Blob([body], { type: 'application/json' }))) {
    fetch('/api/ads/impression', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  }
}

function track(id: number) {
  if (page !== location.pathname) {
    page = location.pathname; // client-side navigation = a new page view
    seen = new Set();
  }
  if (seen.has(id)) return;
  seen.add(id);
  queued.push(id);
  timer ??= setTimeout(flush, 1500);
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', flush);

export function useImpression(ref: RefObject<Element>, id?: number) {
  // The rails live in the layout and stay mounted across navigations: observe again on every page.
  const path = usePathname();
  useEffect(() => {
    const el = ref.current;
    if (!el || !id || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          track(id);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, id, path]);
}
