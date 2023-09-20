import BaseDbService from './BaseDbService';
import type {
  InsertProductCategory,
  InsertProductCategoryProduct,
  Product,
  ProductCategory,
  ProductCategoryProduct,
} from '@/utils/supabase/types';
import {cache} from "@/utils/supabase/services/CacheService";

export default class CategoryService extends BaseDbService {
  async getProducts(categoryId: number): Promise<Product[] | null> {
    const { data, error } = await this.supabase
      .from('product_category_product')
      .select('products(*)')
      .eq('category_id', categoryId)
      .order('launch_date', { foreignTable: 'products', ascending: false });

    if (error !== null) {
      throw new Error(error.message);
    }

    return data.map(i => i.products);
  }

  async insert(category: InsertProductCategory): Promise<ProductCategory | null> {
    const { data, error } = await this.supabase.from('product_categories').insert(category).select().single();

    if (error !== null) throw new Error(error.message);

    return data;
  }

  async insertProduct(category: InsertProductCategoryProduct): Promise<ProductCategoryProduct | null> {
    const { data, error } = await this.supabase.from('product_category_product').insert(category).select().single();

    if (error !== null) throw new Error(error.message);

    return data as ProductCategoryProduct;
  }

  async search(searchTerm: string): Promise<ProductCategory[] | null> {
    return cache.get(`categories-${searchTerm}`, async () => {
      const {
        data,
        error
      } = await this.supabase.from('product_categories').select().ilike('name', `%${searchTerm}%`).limit(5);

      if (error !== null) throw new Error(error.message);
      return data;
    });
  }

  async getAll(): Promise<ProductCategory[] | null> {
    return cache.get('all-categories', async () => {
      const {data, error} = await this.supabase.from('product_categories').select();

      if (error !== null) throw new Error(error.message);

      return data;
    }, 60 * 60);
  }
}
