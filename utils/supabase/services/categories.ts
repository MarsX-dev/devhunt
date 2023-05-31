import BaseDbService from './BaseDbService'
import type { Product } from '@/utils/supabase/types'

export default class CategoryService extends BaseDbService {
  async getProducts (categoryId: number): Promise<Product[] | null> {
    const { data, error } = await this.supabase
      .from('product_category_product')
      .select('products(*)')
      .eq('category_id', categoryId)
      .order('launch_date', { foreignTable: 'products', ascending: false })

    if (error !== null) {
      throw new Error(error.message)
    }

    return data.map(i => i.products)
  }
}
