import { ExtendedProduct } from '@/libs/supabase/CustomTypes'
import BaseDbService from '@/libs/supabase/services/BaseDbService'
import { InsertProduct, Product, UpdateProduct } from '@/libs/supabase/types'
import { omit } from '@/libs/helpers'

export default class ProductsService extends BaseDbService {
  getProducts(sortBy: string = 'votes_count', ascending: boolean = false) {
    // there is error in types? foreignTable is required for order options, while it's not
    //@ts-ignore
    return this.supabase
      .from('products')
      .select('*, product_pricing_types(*), product_categories(name), profiles (full_name)')
      .eq('deleted', false)
      .order(sortBy, { ascending })
  }

  async getTopProducts(sortBy: string, ascending: boolean): Promise<ExtendedProduct[]> {
    const { data: products, error } = await this.getProducts(sortBy, ascending)

    if (error) {
      console.error(error)
      return []
    }

    return products as ExtendedProduct[]
  }

  getById(id: number): Promise<ExtendedProduct | null> {
    return this._getOne('id', id)
  }

  getBySlug(slug: string): Promise<ExtendedProduct | null> {
    return this._getOne('slug', slug)
  }

  async voteUnvote(productId: number, userId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('triggerProductVote', { _product_id: productId, _user_id: userId })

    if (error !== null) {
      throw new Error(error.message)
    }

    const product = await this._getOne('id', productId, 'votes_count')

    return product?.votes_count || 0
  }

  async update(id: number, updates: UpdateProduct): Promise<Product> {
    const cleanUpdates = omit(updates, ['deleted_at', 'deleted'])

    const { data, error } = await this.supabase.from('products').update(cleanUpdates).eq('id', id).single()

    if (error != null) throw new Error(error.message)

    return data as Product
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({ deleted: true, deleted_at: new Date() })
      .eq('id', id)

    if (error !== null) throw new Error(error.message)
  }

  async insert(product: InsertProduct): Promise<Product | null> {
    const { data, error } = await this.supabase.from('products').insert(product).select().single()

    if (error !== null) {
      throw new Error(error.message)
    }
    return data
  }

  private async _getOne(
    column: string,
    value: unknown,
    select = '*, product_pricing_types(*), product_categories(name)'
  ) {
    const { data: products, error } = await this.supabase
      .from('products')
      .select(select)
      .eq('deleted', false)
      .eq(column, value)
      .limit(1)

    if (error !== null) {
      throw new Error(error.message)
    }

    const product = products[0]
    if (!product) {
      return null
    }

    return product
  }
}
