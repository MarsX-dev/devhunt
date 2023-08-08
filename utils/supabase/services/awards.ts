import BaseDbService from './BaseDbService';
import { type WinnerOfTheDay, type WinnerOfTheWeek, type WinnerOfTheMonth, type ProductAward } from '@/utils/supabase/CustomTypes';
import ProductsService from '@/utils/supabase/services/products';

export default class AwardsService extends BaseDbService {
  async fallbackProducts<T>(winnersOfAny: T[] | null): Promise<T[] | null> {
    if (winnersOfAny === null || winnersOfAny.length === 0) {
      const randomTools = await new ProductsService(this.supabase).getRandomTools(10);
      if (randomTools === null) {
        return winnersOfAny;
      }

      return randomTools.map(t => {
        return {
          ...t,
          product_pricing: t.product_pricing_types.title,
          product_categories: t.product_categories.map(pc => pc.name),
        };
      }) as T[];
    }

    return winnersOfAny;
  }

  async getWinnersOfTheDay(day: Date | string, limit: number = 100): Promise<WinnerOfTheDay[] | null> {
    const { data, error } = await this.supabase.from('winner_of_the_day').select().eq('day', day).limit(limit);
    if (error !== null) throw new Error(error.message);
    return await this.fallbackProducts(data);
  }

  async getWinnersOfTheWeek(week: number, limit: number = 100): Promise<WinnerOfTheWeek[] | null> {
    const { data, error } = await this.supabase.from('winner_of_the_week').select().eq('week', week).limit(limit);
    if (error !== null) throw new Error(error.message);
    return await this.fallbackProducts(data);
  }

  async getWinnersOfTheMonth(month: number, limit: number = 100): Promise<WinnerOfTheMonth[] | null> {
    const { data, error } = await this.supabase.from('winner_of_the_month').select().eq('month', month).limit(limit);
    if (error !== null) throw new Error(error.message);
    return await this.fallbackProducts(data);
  }

  async getProductRanks(productId: number): Promise<ProductAward[]> {
    const { data, error } = await this.supabase.from('product_ranks').select().eq('product_id', productId);
    if (error !== null) throw new Error(error.message);
    return data;
  }

  async getProductAwards(productId: number): Promise<ProductAward[]> {
    const { data, error } = await this.supabase.from('product_awards').select().eq('product_id', productId);
    if (error !== null) throw new Error(error.message);
    return data;
  }

  async getWeeklyRank(productId: number): Promise<ProductAward[]> {
    const { data, error } = await this.supabase.from('weekly_rank').select().eq('productid', productId).maybeSingle();
    if (error !== null) throw new Error(error.message);
    return data;
  }
}
