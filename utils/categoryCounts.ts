import { unstable_cache } from 'next/cache';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import categories from '@/utils/categories';

export interface CategoryCount {
  name: string;
  count: number;
  href: string;
}

// Launched tools per category, most popular first. Only categories that have a /tools/<slug> page.
export const getCategoryCounts = unstable_cache(
  async (): Promise<CategoryCount[]> => {
    const { data, error } = await serviceClient.rpc('get_category_counts' as never);
    if (error) {
      console.error('category counts failed:', error.message);
      return [];
    }
    const known = new Set(categories.map(c => c.name.toLowerCase()));
    return ((data ?? []) as unknown as { name: string; count: number }[])
      .filter(c => known.has(c.name.toLowerCase()))
      .map(c => ({ name: c.name, count: c.count, href: `/tools/${c.name.toLowerCase().replaceAll(' ', '-')}` }));
  },
  ['category-counts'],
  { revalidate: 3600 },
);
