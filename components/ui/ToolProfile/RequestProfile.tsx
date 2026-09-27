'use client';

import { useEffect } from 'react';

// No profile yet: ask the server to build one (once per tool; the server ignores repeats). The page
// shows it after its next revalidation. Skipped for automated browsers.
export default function RequestProfile({ productId }: { productId: number }) {
  useEffect(() => {
    if (navigator.webdriver) return;
    const key = `dh_profile_${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {}
    const timer = setTimeout(() => fetch(`/api/tools/${productId}/profile`, { method: 'POST', keepalive: true }).catch(() => {}), 2500);
    return () => clearTimeout(timer);
  }, [productId]);
  return null;
}
