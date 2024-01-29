import { type ExtendedProduct } from '@/utils/supabase/CustomTypes';
import BaseDbService from '@/utils/supabase/services/BaseDbService';
import { Profile, type InsertProduct, type Product, type UpdateProduct } from '@/utils/supabase/types';
import { groupByWithRef, omit } from '@/utils/helpers';
import { cache } from '@/utils/supabase/services/CacheService';
import UsersService from './users';

export default class ProductsService extends BaseDbService {
  private readonly DEFULT_PRODUCT_SELECT = '*, product_pricing_types(*), product_categories(name, id)';
  private readonly EXTENDED_PRODUCT_SELECT = '*, product_pricing_types(*), product_categories(*), profiles (full_name)';
  public readonly EXTENDED_PRODUCT_SELECT_WITH_CATEGORIES =
    '*, product_pricing_types(*), product_categories!inner(*), profiles (full_name)';

  async getWeekNumber(dateIn: Date, startDay: number): Promise<number> {
    const key = `week-number-${dateIn}-${startDay}`;

    return cache.get(key, async () => {
      const { data, error } = await this.supabase.rpc('get_week_number', {
        date_in: dateIn,
        start_day: startDay,
      });
      if (error !== null) throw new Error(error.message);
      return data as number;
    });
  }

  async getWeeks(year: number, startDay: number) {
    const { data, error } = await this.supabase.rpc('get_weeks', {
      year_in: year,
      start_day: startDay,
    });
    if (error !== null) throw new Error(error.message);
    return data.map(i => ({
      week: i.week_number,
      startDate: i.start_date,
      endDate: i.end_date,
    }));
  }

  async getPrevLaunchDays(launchDate: Date, limit = 1): Promise<{ launchDate: Date; products: ExtendedProduct[] }[]> {
    const { data, error } = await this.supabase.rpc('get_prev_launch_days', {
      _launch_date: launchDate.toISOString(),
      _limit: limit,
    });
    if (error !== null) throw new Error(error.message);
    return data.map(i => ({
      launchDate: new Date(i.launch_date),
      products: ((i.products as Array<any>) || []).map(k => ({
        ...k.product,
        product_pricing_types: k.product_pricing_types,
        product_categories: k.product_categories,
      })) as ExtendedProduct[],
    }));
  }

  async getNextLaunchDays(launchDate: Date, limit = 1): Promise<{ launchDate: Date; products: ExtendedProduct[] }[]> {
    const { data, error } = await this.supabase.rpc('get_next_launch_days', {
      _launch_date: launchDate.toISOString(),
      _limit: limit,
    });
    if (error !== null) throw new Error(error.message);
    return data.map(i => ({
      launchDate: new Date(i.launch_date),
      products: ((i.products as Array<any>) || []).map(k => ({
        ...k.product,
        product_pricing_types: k.product_pricing_types,
        product_categories: k.product_categories,
      })) as ExtendedProduct[],
    }));
  }

  async getWeeklyWinners(excludeWeek: number = 0): Promise<ExtendedProduct[]> {
    const { data, error } = await this.supabase.from('weekly_winners').select();
    if (error !== null) throw new Error(error.message);
    return data
      .filter(i => i.week !== excludeWeek)
      .map(i => ({
        ...i.product_data.product,
        product_pricing_types: i.product_data.product_pricing_types,
        product_categories: i.product_data.product_categories,
      })) as ExtendedProduct[];
  }

  async getPrevLaunchWeeks(
    year: number,
    weekStartDay: number,
    launchWeek: number,
    limit = 1,
  ): Promise<{ week: number; startDate: Date; endDate: Date; products: ExtendedProduct[] }[]> {
    const { data, error } = await this.supabase.rpc('get_prev_launch_weeks', {
      _year: year,
      _start_day: weekStartDay,
      _launch_week: launchWeek,
      _limit: limit,
    });
    if (error !== null) throw new Error(error.message);
    return data.map(i => ({
      week: i.week,
      startDate: new Date(i.start_date),
      endDate: new Date(i.end_date),
      products: ((i.products as Array<any>) || []).map(k => ({
        ...k.product,
        product_pricing_types: k.product_pricing_types,
        product_categories: k.product_categories,
      })) as ExtendedProduct[],
    }));
  }

  async getNextLaunchWeeks(
    year: number,
    weekStartDay: number,
    launchWeek: number,
    limit = 1,
  ): Promise<{ week: number; startDate: Date; endDate: Date; products: ExtendedProduct[] }[]> {
    const { data, error } = await this.supabase.rpc('get_next_launch_weeks', {
      _year: year,
      _start_day: weekStartDay,
      _launch_week: launchWeek,
      _limit: limit,
    });
    if (error !== null) throw new Error(error.message);
    return data.map(i => ({
      week: i.week,
      startDate: new Date(i.start_date),
      endDate: new Date(i.end_date),
      products: ((i.products as Array<any>) || []).map(k => ({
        ...k.product,
        product_pricing_types: k.product_pricing_types,
        product_categories: k.product_categories,
      })) as ExtendedProduct[],
    }));
  }

  async getProductsCountByDay(startDate: Date, endDate: Date): Promise<{ date: Date; count: number }[]> {
    const { data, error } = await this.supabase.rpc('get_products_count_by_date', {
      _start_date: startDate.toISOString(),
      _end_date: endDate.toISOString(),
    });
    if (error !== null) throw new Error(error.message);
    return data.map(i => ({ date: new Date(i.date), count: i.product_count }));
  }

  async getProductsCountByWeek(
    startWeek: number,
    endWeek: number,
    year: number,
  ): Promise<{ week: number; startDate: Date; endDate: Date; count: number }[]> {
    const queryProductsCount = async (startWeek: number, endWeek: number, year: number) => {
      const { data, error } = await this.supabase.rpc('get_products_count_by_week', {
        start_week: startWeek,
        end_week: endWeek,
        year_in: year,
        start_day: 2, // Tuesday
      });

      if (error !== null) throw new Error(error.message);

      return data.map(i => ({
        week: i.week_number,
        startDate: new Date(i.start_date),
        endDate: new Date(i.end_date),
        count: i.product_count,
      }));
    };

    let results = [];

    // If endWeek is in the current year
    if (endWeek <= 52) {
      results = await queryProductsCount(startWeek, endWeek, year);
    } else {
      // Split the query into current year and next year
      const resultsCurrentYear = await queryProductsCount(startWeek, 52, year);
      const resultsNextYear = await queryProductsCount(1, endWeek - 52, year + 1);
      results = [...resultsCurrentYear, ...resultsNextYear];
    }

    return results;
  }

  getProducts(
    sortBy: string = 'votes_count',
    ascending: boolean = false,
    pageSize = 20,
    pageNumber = 1,
    categoryId?: number,
    selectQuery = this.EXTENDED_PRODUCT_SELECT,
  ) {
    const key = `products-${sortBy}-${ascending}-${categoryId}-${pageNumber}-${pageSize}-${selectQuery}`;

    return cache.get(key, async () => {
      // @ts-expect-error there is error in types? foreignTable is required for order options, while it's not
      let products = this.supabase.from('products').select(selectQuery).eq('deleted', false);

      if (categoryId) {
        products = products.eq('product_categories.id', categoryId);
      }

      return products.range(pageSize * (pageNumber - 1), pageSize * pageNumber - 1).order(sortBy, { ascending });
    });
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
    const { data } = await this.supabase.from('products').select(this.DEFULT_PRODUCT_SELECT).eq('owner_id', userId).eq('deleted', false);

    return data;
  }

  async getUserVoteById(userId: string, productId: number) {
    if (!userId || !productId) return 0;
    const { data } = await this.supabase.from('product_votes').select().eq('user_id', userId).eq('product_id', productId).maybeSingle();
    return data;
  }

  async getRandomTools(limit: number): Promise<ExtendedProduct[] | null> {
    const { data } = await this.supabase.from('products').select(this.EXTENDED_PRODUCT_SELECT).eq('deleted', false).limit(limit);
    return data;
  }

  async getToolsByNameOrDescription(input: string, limit: number): Promise<ExtendedProduct[] | null> {
    const key = `product-search-by-text-${input}-${limit}`;

    return cache.get(key, async () => {
      const query = `%${input}%`;

      const { data } = await this.supabase
        .from('products')
        .select(this.EXTENDED_PRODUCT_SELECT)
        .eq('deleted', false)
        .or(`description.ilike.${query},slogan.ilike.${query},name.ilike.${query}`)
        .limit(limit)
        .order('votes_count', { ascending: false });

      return data;
    });
  }

  async getById(id: number): Promise<ExtendedProduct | null> {
    const key = `product-details-id-${id}`;

    return cache.get(key, async () => {
      return this._getOne('id', id);
    });
  }

  async getBySlug(slug: string, trackViews = false): Promise<ExtendedProduct | null> {
    const key = `product-details-slug-${slug}`;

    const product = await cache.get(key, async () => {
      const { data } = await this.supabase.from('products').select(this.DEFULT_PRODUCT_SELECT).eq('slug', slug).single();

      return data;
    });

    if (trackViews && product && !product.deleted) {
      this.viewed(product.id);
    }

    return product as ExtendedProduct;
  }

  async getVoters(id: number) {
    const key = `product-id-${id}`;

    const votersList = await cache.get(key, async () => {
      let { data } = await this.supabase.from('product_votes').select('*').eq('product_id', id);
      const promises = data?.map(async item => this.getUserProfileById(item.user_id));
      return await Promise.all(promises as []);
    });

    return votersList;
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
    const { error } = await this.supabase.from('product_category_product').insert({
      product_id: productId,
      category_id: categoryId,
    });

    if (error != null) throw new Error(error.message);

    return true;
  }

  // Related to getUpvotesGroupedByProducts
  async getUserProfileById(id: string): Promise<Profile | null> {
    const key = `users-${id}`;

    return cache.get(
      key,
      async () => {
        const { data } = await this.supabase.from('profiles').select().eq('id', id).single();
        return data;
      },
      180,
    );
  }

  async getUpvotesGroupedByProducts(afterDate: Date) {
    const { data, error } = await this.supabase
      .from('product_votes')
      .select('*, products ( id, name, slug, profiles!inner (id) )')
      .gte('created_at', afterDate.toISOString())
      .order('created_at', { ascending: false });

    if (error !== null) throw new Error(error.message);

    const userIds = data?.map(c => [c.products?.profiles?.id]).flat();
    const userWithEmailsMap = await new UsersService(this.supabase).getUserWithEmails(userIds);
    data?.forEach(c => {
      c.products.profiles.email = userWithEmailsMap.get(c.products.profiles.id);
    });

    const groups = groupByWithRef(
      data,
      c => c.products?.id,
      c => c.products,
    );

    return Promise.all(
      Object.values(groups).map(async g => ({
        product: g.ref,
        voter_data: {
          full_name: (await this.getUserProfileById(g.items[0].user_id))?.full_name,
          id: (await this.getUserProfileById(g.items[0].user_id))?.id,
        },
      })),
    );
  }

  private async _getOne(column: string, value: unknown, select = this.DEFULT_PRODUCT_SELECT) {
    const { data } = await this.supabase.from('products').select(select).eq('deleted', false).eq(column, value).single();
    return data;
  }
}
