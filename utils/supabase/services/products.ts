import { type ExtendedProduct } from '@/utils/supabase/CustomTypes';
import BaseDbService from '@/utils/supabase/services/BaseDbService';
import { type InsertProduct, type Product, type UpdateProduct } from '@/utils/supabase/types';
import { omit } from '@/utils/helpers';

export default class ProductsService extends BaseDbService {
  private readonly EXTENDED_PRODUCT_SELECT = '*, product_pricing_types(*), product_categories(*), profiles (full_name)';

  getProducts(sortBy: string = 'votes_count', ascending: boolean = false) {
    // @ts-expect-error there is error in types? foreignTable is required for order options, while it's not
    return this.supabase.from('products').select(this.EXTENDED_PRODUCT_SELECT).eq('deleted', false).order(sortBy, { ascending });
  }

  async getSimilarProducts(productId: number): Promise<Product[]> {
    const { data, error } = await this.supabase.rpc('get_similar_products', { _product_id: productId });
    if (error !== null) throw new Error(error.message);
    return data;
  }

  async getTopProducts(sortBy: string, ascending: boolean): Promise<ExtendedProduct[]> {
    const { data: products, error } = await this.getProducts(sortBy, ascending);
    if (error) throw new Error(error.message);
    return products as ExtendedProduct[];
  }

  async getMostDiscussedProducts(limit = 10): Promise<ExtendedProduct[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select(this.EXTENDED_PRODUCT_SELECT)
      .eq('deleted', false)
      .order('comments_count', { ascending: false })
      .limit(limit);

    if (error !== null) throw new Error(error.message);
    return data as ExtendedProduct[];
  }

  async getRelatedProducts(
    productId: number,
    categoryNames: { name: string }[],
    sortBy: string,
    ascending: boolean,
  ): Promise<ExtendedProduct[]> {
    const { data: products, error } = await this.getProducts(sortBy, ascending).neq('id', productId);

    if (error) {
      console.error(error);
      return [];
    }

    const filteredProducts = products
      .filter(item => item.product_categories?.some(category => categoryNames.includes(category.name)))
      .slice(0, 8);

    return filteredProducts as ExtendedProduct[];
  }

  async getUserProductsById(userId: string) {
    const { data } = await this.supabase
      .from('products')
      .select('*, product_pricing_types(*), product_categories(*)')
      .eq('owner_id', userId);
    return data;
  }

  async getUserVoteById(userId: string, productId: number) {
    const { data } = await this.supabase.from('product_votes').select().eq('user_id', userId).eq('product_id', productId).single();
    return data;
  }

  async getRandomTools(limit: number): Promise<ExtendedProduct[] | null> {
    const { data } = await this.supabase.from('products').select(this.EXTENDED_PRODUCT_SELECT).limit(limit);

    return data;
  }

  async getById(id: number): Promise<ExtendedProduct | null> {
    return await this._getOne('id', id);
  }

  async getBySlug(slug: string): Promise<ExtendedProduct | null> {
    return await this._getOne('slug', slug);
  }

  async voteUnvote(productId: number, userId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('triggerProductVote', { _product_id: productId, _user_id: userId });

    if (error !== null) {
      throw new Error(error.message);
    }

    const product = await this._getOne('id', productId, 'votes_count');

    return product?.votes_count || 0;
  }

  async update(id: number, updates: UpdateProduct, productCategoryIds: number[] = []): Promise<Product> {
    const cleanUpdates = omit(updates, ['deleted_at', 'deleted']);

    const { data, error } = await this.supabase.from('products').update(cleanUpdates).eq('id', id).single();

    if (error != null) throw new Error(error.message);

    if (productCategoryIds.length !== 0) {
      await Promise.all(productCategoryIds.map(async id => await this.addProductToCategory((data as Product).id, id)));
    }

    return data as Product;
  }

  async addProductToCategory(productId: number, categoryId: number): Promise<boolean> {
    const { data, error } = await this.supabase.from('product_category_product').insert({
      product_id: productId,
      category_id: categoryId,
    });

    if (error != null) throw new Error(error.message);

    return true;
  }

  async dropProductFromCategory(productId: number, categoryId: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('product_category_product')
      .delete()
      .eq('product_id', productId)
      .eq('category_id', categoryId);

    if (error !== null) throw new Error(error.message);

    return true;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from('products').update({ deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);

    if (error !== null) throw new Error(error.message);
  }

  async insert(product: InsertProduct): Promise<Product | null> {
    const { data, error } = await this.supabase.from('products').insert(product).select().single();
    if (error !== null) throw new Error(error.message);
    return data;
  }

  async search(searchTerm: string): Promise<Product[] | null> {
    const { data, error } = await this.supabase.from('products').select('*').ilike('name', `%${searchTerm}%`).limit(5);

    if (error !== null) throw new Error(error.message);
    return data;
  }

  private async _getOne(column: string, value: unknown, select = '*, product_pricing_types(*), product_categories(name)') {
    const { data: products, error } = await this.supabase.from('products').select(select).eq('deleted', false).eq(column, value).limit(1);

    if (error !== null) {
      throw new Error(error.message);
    }

    const product = products[0];
    if (!product) {
      return null;
    }

    return product;
  }
}
