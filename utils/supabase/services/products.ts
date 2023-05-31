import { ExtendedProduct } from '@/utils/supabase/CustomTypes'
import BaseDbService from '@/utils/supabase/services/BaseDbService'
import { InsertProduct, Product, UpdateProduct } from '@/utils/supabase/types'
import { omit } from '@/utils/helpers'

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

  async getSimilarProducts(productId: number): Promise<Product[]> {
    const { data, error } = await this.supabase.rpc('get_similar_products', { _product_id: productId })
    if (error !== null) throw new Error(error.message)
    return data
  }

  async getTopProducts(sortBy: string, ascending: boolean): Promise<ExtendedProduct[]> {
    const { data: products, error } = await this.getProducts(sortBy, ascending)
    if (error) throw new Error(error.message)
    return products as ExtendedProduct[]
  }

  async getMostDiscussedProducts(limit = 10): Promise<ExtendedProduct[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, product_categories(name)')
      .eq('deleted', false)
      .order('comments_count', { ascending: false })
      .limit(limit)

    if (error !== null) throw new Error(error.message)
    return data as ExtendedProduct[]
  }

  async getRelatedProducts(
    productId: number,
    categoryNames: { name: string }[],
    sortBy: string,
    ascending: boolean
  ): Promise<ExtendedProduct[]> {
    const { data: products, error } = await this.getProducts(sortBy, ascending).neq('id', productId)

    if (error) {
      console.error(error)
      return []
    }

    const filteredProducts = products
      .filter(item => item.product_categories?.some(category => categoryNames.includes(category.name)))
      .slice(0, 8)

    return filteredProducts as ExtendedProduct[]
  }

  async getUserProductsById(userId: string, sortBy: string, ascending: boolean) {
    const { data } = await this.getProducts(sortBy, ascending).eq('owner_id', userId)
    return data || null
  }

  async getUserVoteById(userId: string, productId: number) {
    const { data } = await this.supabase
      .from('product_votes')
      .select()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()
    return data || null
  }

  async getRandomTools(limit: number): Promise<Product[] | null> {
    const { data } = await this.supabase.from('products').select().limit(limit)
    return data || null
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
    if (error !== null) throw new Error(error.message)
    return data
  }

  async search(searchTerm: string): Promise<Product[] | null> {
    const { data, error } = await this.supabase.from('products').select('*').ilike('name', `%${searchTerm}%`).limit(5)

    if (error !== null) throw new Error(error.message)
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
