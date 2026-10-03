'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { prefetchRoute } from '@/utils/prefetch';
import { skeletonForPath } from '@/components/ui/Skeletons/PageSkeletons';

// Every click on an internal link should show the destination right away: its loading skeleton,
// then the page. Next only manages that when the link was prefetched and the prefetch has finished,
// and it prefetches a <Link> only once it scrolls into view (never in closed menus), once per page
// load (the loading state expires after 5 minutes). So:
// 1. Prefetch any internal link the moment the visitor shows intent (hover, touch, keyboard focus).
// 2. If a click still has nothing to show after a moment (server slow, prefetch not back yet), cover
//    the page with the destination's skeleton, built in the browser from the URL alone. It stays until
//    the new URL renders; the route's loading.tsx shows the same skeleton, so the handover is seamless.
const FRESH_MS = 4 * 60 * 1000; // re-prefetch before Next's 5-minute limit for reusing a loading state
const SHOW_AFTER_MS = 80; // when the prefetch was ready, Next has already switched by then: no flash
const GIVE_UP_MS = 20_000; // the server never answered: show the old page again

// Same-origin page link that a plain click would navigate to (no new tab, download or modifier key).
// `route` is Next's current route, not location: the tool preview pushes the tool's URL itself.
function internalHref(route: string, target: EventTarget | null, e?: MouseEvent) {
  const a = (target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return null;
  if (e && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return null;
  if (url.pathname + url.search === route) return null; // same page (#hash)
  return { a, url };
}

export default function InstantNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<{ path: string; top: number } | null>(null);
  const search = searchParams?.toString();
  // The committed route. Set in an effect, not during render: Next renders the next route in a
  // transition before it commits, and that render must not count as "already switched".
  const current = pathname + (search ? `?${search}` : '');
  const route = useRef(current);
  useEffect(() => {
    route.current = current;
  }, [current]);

  useEffect(() => {
    const seen = new Map<string, number>();
    const onIntent = (e: Event) => {
      const link = internalHref(route.current, e.target);
      if (!link) return;
      const href = link.url.pathname + link.url.search;
      const now = Date.now();
      if (now - (seen.get(href) ?? 0) < FRESH_MS) return;
      seen.set(href, now);
      prefetchRoute(router, href);
    };

    let showTimer: ReturnType<typeof setTimeout> | undefined;
    const onClick = (e: MouseEvent) => {
      const link = internalHref(route.current, e.target, e);
      // Links whose click opens something in place (tool cards open the preview) opt out.
      if (!link || link.a.closest('[data-no-instant-nav]')) return;
      const from = route.current;
      clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        if (route.current !== from) return; // Next already switched: nothing to cover
        const top = document.querySelector('nav')?.getBoundingClientRect().bottom ?? 0;
        setPending({ path: link.url.pathname, top: Math.max(0, top) });
      }, SHOW_AFTER_MS);
    };

    const clear = () => setPending(null);
    const opts = { capture: true, passive: true };
    document.addEventListener('mouseover', onIntent, opts);
    document.addEventListener('touchstart', onIntent, opts);
    document.addEventListener('focusin', onIntent, opts);
    document.addEventListener('click', onClick);
    window.addEventListener('popstate', clear);
    return () => {
      clearTimeout(showTimer);
      document.removeEventListener('mouseover', onIntent, opts);
      document.removeEventListener('touchstart', onIntent, opts);
      document.removeEventListener('focusin', onIntent, opts);
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', clear);
    };
  }, [router]);

  // The new URL rendered (its loading.tsx or the page itself): hand over.
  useEffect(() => setPending(null), [pathname, search]);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(null), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  const skeleton = pending && skeletonForPath(pending.path);
  if (!skeleton) return null;
  return (
    // Above modals (z-40): "Open full page" in the tool preview navigates from inside one.
    <div className="fixed inset-x-0 bottom-0 z-[45] overflow-hidden bg-slate-900" style={{ top: pending.top }}>
      {skeleton}
    </div>
  );
}
