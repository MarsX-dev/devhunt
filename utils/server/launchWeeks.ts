import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import ProductsService from '@/utils/supabase/services/products';
import { type WeekCount } from '@/utils/launchWeeks';

// Upcoming launch weeks with their current tool counts (fresh, server-side).
export async function getUpcomingWeeks(weeksAhead = 260): Promise<WeekCount[]> {
  const service = new ProductsService(serviceClient as any);
  const now = new Date();
  const currentWeek = await service.getWeekNumber(now, 2);
  return service.getProductsCountByWeek(currentWeek + 1, currentWeek + weeksAhead, now.getFullYear());
}
