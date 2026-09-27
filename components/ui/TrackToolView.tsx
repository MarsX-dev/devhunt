'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';

// Counts a tool page view from the browser (once per page load). Counting on the server ran on every
// request, crawlers included, and would stop counting once the page is served from the CDN cache.
export default function TrackToolView({ productId }: { productId: number }) {
  useEffect(() => {
    if (navigator.webdriver) return;
    void new ProductsService(createBrowserClient()).viewed(productId);
  }, [productId]);
  return null;
}
