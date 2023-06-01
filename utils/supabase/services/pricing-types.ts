import BaseDbService from './BaseDbService'
import type {
  ProductPricingType,
} from '@/utils/supabase/types'

export default class ProductPricingTypesService extends BaseDbService {
  async getAll (): Promise<ProductPricingType[] | null> {
    const { data, error } = await this.supabase.from('product_pricing_types')
      .select()
      .limit(10)

    if (error !== null) throw new Error(error.message)
    return data
  }
}
