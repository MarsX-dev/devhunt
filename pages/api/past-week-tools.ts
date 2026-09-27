import type { NextApiRequest, NextApiResponse } from 'next';
import ProductsService from '@/utils/supabase/services/products';
import { createBrowserClient } from '@/utils/supabase/browser';
import { simpleToolApiDtoFormatter } from '@/pages/api/api-formatters';
import { cache } from '@/utils/supabase/services/CacheService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Public endpoint: a small, bounded number of weeks (each distinct limit is its own cache entry).
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '2') || 2, 1), 10);

  const today = new Date();
  const productService = new ProductsService(createBrowserClient());
  const currentWeek = await productService.getWeekNumber(today, 2) - 1;

  const tools = await cache.get(
    `past-week-tools-api-${today.getFullYear()}-${currentWeek}-${limit}`,
    async () => {
      return await productService.getPrevLaunchWeeks(today.getFullYear(), 2, currentWeek, limit);
    },
    60,
  );

  const result = tools.map(i => ({
    ...i,
    products: i.products.map(simpleToolApiDtoFormatter),
  }));

  res.json(result);
}
