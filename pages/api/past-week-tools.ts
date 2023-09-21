import type { NextApiRequest, NextApiResponse } from 'next';
import ProductsService from '@/utils/supabase/services/products';
import { createBrowserClient } from '@/utils/supabase/browser';
import { simpleToolApiDtoFormatter } from '@/pages/api/api-formatters';
import { cache } from '@/utils/supabase/services/CacheService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let limit = parseInt((req.query.limit as string) || '2');
  if (limit < 1) limit = 2;

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

  console.log(tools);

  res.json(tools.map(i => ({
    ...i,
    products: i.products.map(simpleToolApiDtoFormatter),
  })));
}
