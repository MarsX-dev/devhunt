import BaseDbService from './BaseDbService'
import { type WinnerOfTheDay, type WinnerOfTheWeek, type WinnerOfTheMonth, type ProductAward } from '@/libs/supabase/CustomTypes'

export default class AwardsService extends BaseDbService {
  async getWinnersOfTheDay (day: Date, limit: number = 100): Promise<WinnerOfTheDay[] | null> {
    const { data, error } = await this.supabase.from('winner_of_the_day').select().eq('day', day).limit(limit)

    if (error !== null) {
      throw new Error(error.message)
    }

    return data
  }

  async getWinnersOfTheWeek (week: number, limit: number = 100): Promise<WinnerOfTheWeek[] | null> {
    const { data, error } = await this.supabase.from('winner_of_the_week').select().eq('week', week).limit(limit)

    if (error !== null) {
      throw new Error(error.message)
    }

    return data
  }

  async getWinnersOfTheMonth (month: number, limit: number = 100): Promise<WinnerOfTheMonth[] | null> {
    const { data, error } = await this.supabase.from('winner_of_the_month').select().eq('month', month).limit(limit)

    if (error !== null) {
      throw new Error(error.message)
    }

    return data
  }

  async getProductAwards (productId: number): Promise<ProductAward[]> {
    const { data, error } = await this.supabase.from('product_awards').select().eq('product_id', productId)

    if (error !== null) {
      throw new Error(error.message)
    }

    return data
  }
}
