import { ExtendedProduct } from '@/libs/supabase/CustomTypes'
import BaseDbService from '@/libs/supabase/services/BaseDbService'

export default class ProductsService extends BaseDbService {
  constructor(isServer: boolean) {
    super(isServer)
  }

  getProducts(sortBy: string = 'votes_count', ascending: boolean = false) {
    // there is error in types? foreignTable is required for order options, while it's not
    //@ts-ignore
    return this.supabase
      .from('products')
      .select('*, product_pricing_types(*), product_categories(name)')
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

  getBySlug(slug: number): Promise<ExtendedProduct | null> {
    return this._getOne('slug', slug)
  }

  async voteUnvote(productId: number, userId: string): Promise<boolean | null> {
    const { data, error } = await this.supabase.rpc('upvoteProduct', { _product_id: productId, _user_id: userId })
    if (error !== null) {
      throw new Error(error.message)
    }

    return data
  }

  private async _getOne(column: string, value: unknown) {
    const { data: products, error } = await this.supabase
      .from('products')
      .select('*, product_pricing_types(*), product_categories(name)')
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
