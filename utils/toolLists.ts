import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import { LIST_PAGE_SIZE, TOOL_ROW_COLUMNS, type ToolRowData } from '@/utils/toolRow';

export * from '@/utils/toolRow';

// All-time leaderboard (optionally one category), one page at a time with the real total.
// Lists paid launches (as these pages always have) and DevHunt's reference listings of well-known tools.
export const getLeaderboardPage = unstable_cache(
  async (page: number, categoryId: number | null = null): Promise<{ rows: ToolRowData[]; total: number }> => {
    const supabase = createBrowserClient();
    const select = categoryId ? `${TOOL_ROW_COLUMNS}, product_categories!inner(id)` : TOOL_ROW_COLUMNS;
    let query = supabase.from('products').select(select, { count: 'exact' }).eq('deleted', false).or('isPaid.eq.true,is_reference.eq.true');
    if (categoryId) query = query.eq('product_categories.id', categoryId);
    const from = (page - 1) * LIST_PAGE_SIZE;
    const { data, count, error } = await query
      .order('votes_count', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + LIST_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    return {
      rows: ((data ?? []) as any[]).map(({ product_categories, ...row }) => row as ToolRowData),
      total: count ?? 0,
    };
  },
  ['leaderboard-page'],
  { revalidate: 120 },
);
