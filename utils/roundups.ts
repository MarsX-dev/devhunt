import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import { TOOL_ROW_COLUMNS, type ToolRowData } from '@/utils/toolRow';

// Monthly roundups: /best/{year}/{month} (seo-plan.md A7). The month's top launches by votes, its weekly
// winners and the categories they came from. Every month since January 2024 has enough launches for a page.

export const FIRST_MONTH = { year: 2024, month: 1 };
export const TOP_COUNT = 30;

export interface Month {
  year: number;
  month: number; // 1-12
}

export const monthPath = ({ year, month }: Month) => `/best/${year}/${String(month).padStart(2, '0')}`;
export const monthName = ({ year, month }: Month) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// Every month from FIRST_MONTH to the current one, newest first.
export function allMonths(now = new Date()): Month[] {
  const out: Month[] = [];
  for (
    let y = now.getUTCFullYear(), m = now.getUTCMonth() + 1;
    y > FIRST_MONTH.year || (y === FIRST_MONTH.year && m >= FIRST_MONTH.month);

  ) {
    out.push({ year: y, month: m });
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}

export function parseMonth(year: string, month: string, now = new Date()): Month | null {
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) return null;
  const m = { year: Number(year), month: Number(month) };
  return allMonths(now).some(x => x.year === m.year && x.month === m.month) ? m : null;
}

export const isCurrentMonth = ({ year, month }: Month, now = new Date()) =>
  year === now.getUTCFullYear() && month === now.getUTCMonth() + 1;

export interface Roundup {
  total: number;
  top: ToolRowData[];
  winners: { rank: number; tool: ToolRowData }[];
  categories: { name: string; count: number }[];
}

const fetchRoundup = async (year: number, month: number): Promise<Roundup> => {
  const db = createBrowserClient();
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const to = new Date(Math.min(Date.UTC(year, month, 1), Date.now())).toISOString();
  // Launched in the month; tools that don't compete (not_a_fit) and blocked ones are left out.
  const { data, count, error } = await db
    .from('products')
    .select(`${TOOL_ROW_COLUMNS}, product_categories(name)`, { count: 'exact' })
    .eq('deleted', false)
    .eq('moderation', 'ok')
    .gte('launch_start', from)
    .lt('launch_start', to)
    .order('votes_count', { ascending: false })
    .order('id', { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as any[];
  const toRow = ({ product_categories: _categories, ...row }: any) => row as ToolRowData;
  const byId = new Map(rows.map(r => [r.id as number, toRow(r)]));

  // Weekly winners (top 3 of their launch week) among the month's launches.
  const { data: ranks } = rows.length
    ? await db
      .from('product_week_ranks' as never)
      .select('product_id, rank')
      .in('product_id', Array.from(byId.keys()))
      .lte('rank', 3)
    : { data: [] };
  const winners = ((ranks ?? []) as { product_id: number; rank: number }[])
    .map(r => ({ rank: r.rank, tool: byId.get(r.product_id) as ToolRowData }))
    .filter(w => w.tool)
    .sort((a, b) => a.rank - b.rank || b.tool.votes_count - a.tool.votes_count);

  // Categories of the month's most upvoted launches (the top 200).
  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const c of (r.product_categories ?? []) as { name: string }[]) { if (c.name !== 'Other') counts.set(c.name, (counts.get(c.name) ?? 0) + 1); }
  }
  const categories = Array.from(counts, ([name, n]) => ({ name, count: n }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return { total: count ?? rows.length, top: rows.slice(0, TOP_COUNT).map(toRow), winners, categories };
};

// A finished month doesn't change much (votes trickle in), so it's cached for a day; the current month for an hour.
export const getRoundup = async (m: Month) =>
  await unstable_cache(async () => await fetchRoundup(m.year, m.month), ['month-roundup', String(m.year), String(m.month)], {
    revalidate: isCurrentMonth(m) ? 3600 : 86400,
  })();
