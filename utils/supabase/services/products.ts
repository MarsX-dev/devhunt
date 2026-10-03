import { type ExtendedProduct } from '@/utils/supabase/CustomTypes';
import BaseDbService from '@/utils/supabase/services/BaseDbService';
import { type Profile, type InsertProduct, type Product, type UpdateProduct } from '@/utils/supabase/types';
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

  // Weekly winners, newest first, one page of raw rows plus the total (the caller leaves out the
  // week that is still running).
  async getWeeklyWinnersPage(
    offset: number,
    limit: number,
  ): Promise<{ total: number; rows: { week: number; year: number; product: ExtendedProduct }[] }> {
    const { data, count, error } = await this.supabase
      .from('weekly_winners')
      .select('*', { count: 'exact' })
      .order('year', { ascending: false })
      .order('week', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error !== null) throw new Error(error.message);
    return {
      total: count ?? 0,
      rows: data.map(i => ({
        week: i.week as number,
        year: Number(i.year),
        product: {
          ...i.product_data.product,
          product_pricing_types: i.product_data.product_pricing_types,
          product_categories: i.product_data.product_categories,
        } as ExtendedProduct,
      })),
    };
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
    moderation: 'ok' | 'not_a_fit' = 'ok', // which queue to count; 'not_a_fit' is server-only (get_launch_week_counts)
  ): Promise<{ week: number; startDate: Date; endDate: Date; count: number }[]> {
    const queryProductsCount = async (startWeek: number, endWeek: number, year: number) => {
      const args = { start_week: startWeek, end_week: endWeek, year_in: year, start_day: 2 }; // weeks start on Tuesday
      const { data, error } =
        moderation === 'ok'
          ? await this.supabase.rpc('get_products_count_by_week', args)
          : await this.supabase.rpc('get_launch_week_counts' as never, { ...args, _moderation: moderation } as never);

      if (error !== null) throw new Error((error as { message: string }).message);

      return (data as Array<{ week_number: number; start_date: string; end_date: string; product_count: number }>).map(i => ({
        week: i.week_number,
        startDate: new Date(i.start_date),
        endDate: new Date(i.end_date),
        count: i.product_count,
      }));
    };

    // Walk year-by-year so the full requested range is always covered,
    // regardless of how many calendar-year boundaries it crosses.
    const results: { week: number; startDate: Date; endDate: Date; count: number }[] = [];
    let currentYear = year;
    let currentStartWeek = startWeek;
    let weeksLeft = endWeek - startWeek + 1;

    while (weeksLeft > 0 && currentYear <= year + 5) {
      const weeksInYear = (await this.getWeeks(currentYear, 2)).length;
      const currentEndWeek = Math.min(currentStartWeek + weeksLeft - 1, weeksInYear);

      if (currentStartWeek <= weeksInYear) {
        const batch = await queryProductsCount(currentStartWeek, currentEndWeek, currentYear);
        results.push(...batch);
        weeksLeft -= currentEndWeek - currentStartWeek + 1;
      }

      currentStartWeek = 1;
      currentYear++;
    }

    return results;
  }

  async getSimilarProducts(productId: number): Promise<Product[]> {
    const { data, error } = await this.supabase.rpc('get_similar_products', { _product_id: productId });
    if (error !== null) throw new Error(error.message);
    return data;
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
    // The text goes into a PostgREST filter string: drop the characters that have meaning there
    // (commas, parentheses, quotes, wildcards) so a search can't add filters of its own.
    const term = String(input ?? '').replace(/[,()*%\\"'.:]/g, ' ').trim().slice(0, 100);
    const key = `product-search-by-text-${term}-${limit}`;

    return cache.get(key, async () => {
      const query = `%${term}%`;

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
    }, undefined, (p: any) => !p || p.site_status === 'ok');
  }

  async getBySlug(slug: string, trackViews = false): Promise<ExtendedProduct | null> {
    const key = `product-details-slug-${slug}`;

    const product = await cache.get(key, async () => {
      const { data } = await this.supabase.from('products').select(this.DEFULT_PRODUCT_SELECT).eq('slug', slug).maybeSingle();

      return data;
    }, undefined, (p: any) => !p || p.site_status === 'ok'); // hidden tools are owner-only: never shared via the cache

    if (trackViews && product && !product.deleted) {
      this.viewed(product.id);
    }

    return product as ExtendedProduct;
  }

  async getVoters(id: number) {
    const key = `product-id-${id}`;

    const votersList = await cache.get(key, async () => {
      const { data } = await this.supabase
        .from('product_votes')
        .select('user_id')
        .eq('product_id', id)
        .order('created_at', { ascending: true });
      const ids = (data ?? []).map(v => v.user_id);
      // One request per 100 voters (not one per voter: a popular tool used to fire 300+ requests per view).
      const chunks = Array.from({ length: Math.ceil(ids.length / 100) }, (_, i) => ids.slice(i * 100, i * 100 + 100));
      const rows = (
        await Promise.all(chunks.map(async chunk => (await this.supabase.from('profiles').select().in('id', chunk).is('deleted_at', null)).data ?? [])) // deleted accounts aren't shown
      ).flat();
      const byId = new Map(rows.map(p => [p.id, p]));
      return ids.map(uid => byId.get(uid)).filter(Boolean) as Profile[];
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
      Object.values(groups).map(async g => {
        const voter = await this.getUserProfileById(g.items[0].user_id);
        return { product: g.ref, voter_data: { full_name: voter?.full_name, id: voter?.id } };
      }),
    );
  }

  private async _getOne(column: string, value: unknown, select = this.DEFULT_PRODUCT_SELECT) {
    const { data } = await this.supabase.from('products').select(select).eq('deleted', false).eq(column, value).single();
    return data;
  }
}
