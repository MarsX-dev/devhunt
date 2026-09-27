'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { VISIT_KEY, seenBefore, visitState } from '@/utils/analytics';

// Sends one tiny beacon per page view once the browser is idle. Automated browsers are skipped.
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || navigator.webdriver) return;
    const send = () => {
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
      const body = JSON.stringify({ p: pathname, n: newVisitor, d: newToday });
      if (!navigator.sendBeacon?.('/api/hit', new Blob([body], { type: 'text/plain' }))) {
        fetch('/api/hit', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
      }
    };
    const idle = (window as any).requestIdleCallback as ((cb: () => void, o?: object) => number) | undefined;
    const id = idle ? idle(send, { timeout: 3000 }) : window.setTimeout(send, 1000);
    return () => (idle ? (window as any).cancelIdleCallback(id) : clearTimeout(id));
  }, [pathname]);

  return null;
}
