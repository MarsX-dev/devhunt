import { type ExtendedProduct } from '@/utils/supabase/CustomTypes';
import BaseDbService from '@/utils/supabase/services/BaseDbService';
import { type InsertProduct, type Product, type UpdateProduct } from '@/utils/supabase/types';
import { omit } from '@/utils/helpers';

export default class ProductsService extends BaseDbService {
  private readonly EXTENDED_PRODUCT_SELECT = '*, product_pricing_types(*), product_categories(*), profiles (full_name)';

  async getPrevLaunchDays(launchDate: Date, limit = 1): Promise<{ launchDate: Date; products: ExtendedProduct[] }[]> {
    const { data, error } = await this.supabase.rpc('get_prev_launch_days', { _launch_date: launchDate.toISOString(), _limit: limit });
    if (error !== null) throw new Error(error.message);
    return data.map(i => ({
      launchDate: new Date(i.launch_date),
      products: i.products.map(i => ({
        ...i.product,
        product_pricing_types: i.product_pricing_types,
        product_categories: i.product_categories,
      })) as ExtendedProduct[],
    }));
  }

  async getProductsCountByDay(startDate: Date, endDate: Date): Promise<{ date: Date; count: number }[]> {
    const { data, error } = await this.supabase.rpc('get_products_count_by_date', { _start_date: startDate.toISOString(), _end_date: endDate.toISOString() });
    if (error !== null) throw new Error(error.message);
    return data.map(i => ({ date: new Date(i.date), count: i.product_count }));
  }

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
    const { data } = await this.supabase.from('products').select(this.EXTENDED_PRODUCT_SELECT).eq('deleted', false).limit(limit);
    return data;
  }

  async getById(id: number): Promise<ExtendedProduct | null> {
    return this._getOne('id', id);
  }

  async getBySlug(slug: string): Promise<ExtendedProduct | null> {
    const product = await this._getOne('slug', slug);
    await this.viewed(product?.id);
    return product;
  }

  async toggleVote(productId: number, userId: string): Promise<number> {
    const { data } = await this.supabase.rpc('toggleProductVote', { _product_id: productId, _user_id: userId });
    return data ?? 0;
  }

  async viewed(productId: number): Promise<number> {
    const { data } = await this.supabase.rpc('updateViews', { _product_id: productId });
    return data ?? 0;
  }

  async insert(product: InsertProduct, productCategoryIds: number[]): Promise<Product | null> {
    const { data, error } = await this.supabase.from('products').insert(product).select().single();
    if (error !== null) throw new Error(error.message);

    if (productCategoryIds.length !== 0) {
      await Promise.all(productCategoryIds.map(async categoryId => await this._addProductToCategory((data as Product).id, categoryId)));
    }

    return data;
  }

  async update(id: number, updates: UpdateProduct, productCategoryIds: number[] = []): Promise<Product> {
    const cleanUpdates = omit(updates, ['deleted_at', 'deleted']);
    const { data, error } = await this.supabase.from('products').update(cleanUpdates).eq('id', id).select().single();
    await this.supabase.from('product_category_product').delete().eq('product_id', id);
    await Promise.all(productCategoryIds.map(async categoryId => await this._addProductToCategory(id, categoryId)));

    if (error != null) throw new Error(error.message);

    return data as Product;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error !== null) throw new Error(error.message);
  }

  async search(searchTerm: string): Promise<Product[] | null> {
    const { data, error } = await this.supabase.from('products').select('*').ilike('name', `%${searchTerm}%`).eq('deleted', false).limit(8);

    if (error !== null) throw new Error(error.message);
    return data;
  }

  private async _addProductToCategory(productId: number, categoryId: number): Promise<boolean> {
    const { data, error } = await this.supabase.from('product_category_product').insert({
      product_id: productId,
      category_id: categoryId,
    });

    if (error != null) throw new Error(error.message);

    return true;
  }

  private async _getOne(column: string, value: unknown, select = '*, product_pricing_types(*), product_categories(name, id)') {
    const { data, error } = await this.supabase.from('products').select(select).eq('deleted', false).eq(column, value).single();
    if (error !== null) throw new Error(error.message);
    return data;
  }
}
