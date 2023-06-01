import BaseDbService from './BaseDbService'
import type { InsertProductCategory, Product, ProductCategory } from '@/utils/supabase/types'

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

  async insert (category: InsertProductCategory): Promise<ProductCategory | null> {
    const { data, error } = await this.supabase.from('product_categories')
      .insert(category)
      .select()
      .single()

    if (error !== null) throw new Error(error.message)

    return data
  }

  async search (searchTerm: string): Promise<ProductCategory[] | null> {
    const { data, error } = await this.supabase.from('product_categories')
      .select()
      .ilike('name', `%${searchTerm}%`)
      .limit(5)

    if (error !== null) throw new Error(error.message)
    return data
  }
}
