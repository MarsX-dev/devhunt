'use client';

import { useEffect } from 'react';
import { queueView } from '@/utils/viewQueue';

// Counts a tool page view from the browser (once per page load). Counting on the server ran on every
// request, crawlers included, and would stop counting once the page is served from the CDN cache.
export default function TrackToolView({ productId }: { productId: number }) {
  useEffect(() => queueView(productId), [productId]);
  return null;
}
