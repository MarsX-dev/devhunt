import type { NextApiRequest, NextApiResponse } from 'next';
import ApiService from '@/utils/supabase/services/api';
import { simpleToolApiDtoFormatter } from '@/pages/api/api-formatters';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { week, limit = 3, year = new Date().getFullYear(), key } = req.query;
  if (key !== process.env.API_KEY) {
    throw new Error('Forbidden');
  }

  let weekNumber = +week;
  if (week && Number.isNaN(weekNumber)) {
    return res.status(400).json({ message: 'Please provide week number as number' });
  }

  const apiService = new ApiService();

  const today = new Date();
  const currentWeek = await apiService.getWeekNumber(today, 2);

  if (weekNumber === -1) {
    weekNumber = currentWeek > 1 ? currentWeek - 1 : 52;
    year = currentWeek > 1 ? today.getFullYear() : today.getFullYear() - 1;
  }

  if (!weekNumber) {
    weekNumber = currentWeek;
  }

  const weeks = await apiService.getPrevLaunchWeeks(year, 2, weekNumber, 1);
  if (!weeks || weeks.length === 0) {
    return [];
  }

  const { products } = weeks[0];
  const tools = products.slice(0, limit);

  res.json(tools.map(simpleToolApiDtoFormatter));
}
