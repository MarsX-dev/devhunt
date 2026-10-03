'use client';

import { createBrowserClient } from '@/utils/supabase/browser';

// Tool impressions are collected and sent as one bump_views call (not one request per card).
const pending = new Set<number>();
const counted = new Set<number>(); // once per tool per page load
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!pending.size) return;
  const ids = Array.from(pending);
  pending.clear();
  // The query builder only sends the request once it is awaited or then()'d.
  const args: { _ids: number[] } = { _ids: ids };
  createBrowserClient()
    .rpc('bump_views' as never, args as never)
    .then(
      () => {},
      () => {},
    );
}

export function queueView(productId: number) {
  if (typeof window === 'undefined' || navigator.webdriver || counted.has(productId)) return;
  counted.add(productId);
  pending.add(productId);
  if (!timer) {
    timer = setTimeout(flush, 2000);
    window.addEventListener('pagehide', flush, { once: true });
  }
}
