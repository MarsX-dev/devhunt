import { createClient } from '@supabase/supabase-js'
import { type ExtendedProduct } from '@/utils/supabase/CustomTypes';

export default class ApiService {
  private supabase;

  constructor() {
    this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async getWeekNumber(dateIn: Date, startDay: number): Promise<number> {
    const { data, error } = await this.supabase.rpc('get_week_number', {
      date_in: dateIn,
      start_day: startDay,
    });
    if (error !== null) throw new Error(error.message);
    return data as number;
  }

  async getPrevLaunchWeeks(year: number, weekStartDay: number, launchWeek: number, limit = 1): Promise<{ week: number; startDate: Date; endDate: Date; products: ExtendedProduct[]; }[]> {
    const { data, error } = await this.supabase.rpc('get_prev_launch_weeks', {
      _year: year,
      _start_day: weekStartDay,
      _launch_week: launchWeek,
      _limit: limit,
    });

    if (error !== null) throw new Error(error.message);
    const res = data.map(i => ({
      week: i.week,
      startDate: new Date(i.start_date),
      endDate: new Date(i.end_date),
      products: (i.products as Array<any> || []).map(k => ({
        ...k.product,
        product_pricing_types: k.product_pricing_types,
        product_categories: k.product_categories,
      })) as ExtendedProduct[],
    }));

    await Promise.all(res.map(async i => {
      await Promise.all(i.products.map(async p => {
        if (!p.owner_id) return;
        const usr = await this.supabase.auth.admin.getUserById(p.owner_id);
        p.email = usr.data.user?.email;
      }));
    }));

    return res;
  }
}
