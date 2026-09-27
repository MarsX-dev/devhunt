import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import { getToolProfile, type ToolProfileView } from '@/utils/toolProfileData';
import { sectionShown } from '@/utils/toolProfile';
import { TOOL_ROW_COLUMNS, toToolRow, type ToolRowData } from '@/utils/toolRow';

// Data for /tool/[slug]/alternatives and /compare/[a]-vs-[b]. Public data only (anon client, so
// hidden tools never show up), cached for 10 minutes.

export interface CompareProduct {
  id: number;
  slug: string;
  name: string;
  slogan: string | null;
  logo_url: string | null;
  demo_url: string | null;
  votes_count: number;
  launch_start: string | null;
  pricing: string | null;
  categories: { id: number; name: string }[];
}

const PRODUCT_COLUMNS = 'id, slug, name, slogan, logo_url, demo_url, votes_count, launch_start, deleted, moderation, product_pricing_types(title), product_categories(id, name)';

const toCompareProduct = (p: any): CompareProduct => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  slogan: p.slogan,
  logo_url: p.logo_url,
  demo_url: p.demo_url,
  votes_count: p.votes_count ?? 0,
  launch_start: p.launch_start,
  pricing: p.product_pricing_types?.title ?? null,
  categories: (p.product_categories ?? []).filter((c: any) => c.name !== 'Other'),
});

async function productBySlug(slug: string): Promise<CompareProduct | null> {
  const { data } = await createBrowserClient().from('products').select(PRODUCT_COLUMNS).eq('slug', slug).maybeSingle();
  const p = data as any;
  return p && !p.deleted && p.moderation !== 'blocked' ? toCompareProduct(p) : null;
}

// The tool's picked alternatives (with how they differ) plus more tools from its categories.
export const getAlternatives = unstable_cache(
  async (slug: string): Promise<{ tool: CompareProduct; profile: ToolProfileView | null; more: ToolRowData[] } | null> => {
    const tool = await productBySlug(slug);
    if (!tool) return null;
    const profile = await getToolProfile(tool.id);
    const picked = new Set([tool.id, ...(profile?.compare.map(c => c.id) ?? [])]);
    let more: ToolRowData[] = [];
    const categoryIds = tool.categories.map(c => c.id);
    if (categoryIds.length) {
      const { data } = await createBrowserClient()
        .from('products')
        .select(`${TOOL_ROW_COLUMNS}, product_category_product!inner(category_id)`)
        .in('product_category_product.category_id', categoryIds)
        .eq('deleted', false)
        .eq('moderation', 'ok')
        .lte('launch_start', new Date().toISOString())
        .order('votes_count', { ascending: false })
        .limit(40);
      const seen = new Set<number>();
      more = ((data ?? []) as any[])
        .filter(p => !picked.has(p.id) && !seen.has(p.id) && seen.add(p.id))
        .slice(0, 20)
        .map(toToolRow);
    }
    return { tool, profile: profile && sectionShown(profile.data, 'compare') ? profile : profile ? { ...profile, compare: [] } : null, more };
  },
  ['tool-alternatives'],
  { revalidate: 600 },
);

export interface Comparison {
  a: CompareProduct;
  b: CompareProduct;
  profileA: ToolProfileView | null;
  profileB: ToolProfileView | null;
  difference: string | null; // how they differ, from one tool's profile
}

// Two tools are compared only when one lists the other as an alternative (keeps these pages useful).
export const getComparison = unstable_cache(
  async (slugA: string, slugB: string): Promise<Comparison | null> => {
    const [a, b] = await Promise.all([productBySlug(slugA), productBySlug(slugB)]);
    if (!a || !b) return null;
    const [profileA, profileB] = await Promise.all([getToolProfile(a.id), getToolProfile(b.id)]);
    const altOf = (profile: ToolProfileView | null, id: number) =>
      profile && sectionShown(profile.data, 'compare') ? profile.data.alternatives.find(x => x.id === id) : undefined;
    const aToB = altOf(profileA, b.id);
    const bToA = altOf(profileB, a.id);
    if (!aToB && !bToA) return null;
    return { a, b, profileA, profileB, difference: aToB?.difference ?? bToA?.difference ?? null };
  },
  ['tool-comparison'],
  { revalidate: 600 },
);

// Canonical pairs for the sitemap: every (tool, alternative) from visible profiles.
export async function comparisonPairs(): Promise<[string, string][]> {
  const client = createBrowserClient();
  const rows: { product_id: number; data: any }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await client.from('tool_profiles' as never).select('product_id, data').range(from, from + 999);
    rows.push(...((data ?? []) as any[]));
    if (!data || data.length < 1000) break;
  }
  const ids = new Set<number>();
  const pairs: [number, number][] = [];
  for (const row of rows) {
    if (row.data?.hidden?.includes('compare')) continue;
    for (const alt of row.data?.alternatives ?? []) {
      pairs.push([row.product_id, alt.id]);
      ids.add(row.product_id).add(alt.id);
    }
  }
  const slugs = new Map<number, string>();
  const idList = Array.from(ids);
  for (let i = 0; i < idList.length; i += 300) {
    const { data } = await client.from('products').select('id, slug, deleted').in('id', idList.slice(i, i + 300));
    for (const p of (data ?? []) as any[]) if (!p.deleted) slugs.set(p.id, p.slug);
  }
  const out = new Map<string, [string, string]>();
  for (const [x, y] of pairs) {
    const [sa, sb] = [slugs.get(x), slugs.get(y)];
    if (sa && sb) {
      const [first, second] = [sa, sb].sort();
      out.set(`${first}|${second}`, [first, second]);
    }
  }
  return Array.from(out.values());
}

// Tools whose alternatives page is worth indexing (a profile with picked alternatives).
export async function toolsWithAlternatives(): Promise<string[]> {
  const client = createBrowserClient();
  const ids: number[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await client.from('tool_profiles' as never).select('product_id, data->alternatives').range(from, from + 999);
    for (const r of (data ?? []) as any[]) if (Array.isArray(r.alternatives) && r.alternatives.length >= 2) ids.push(r.product_id);
    if (!data || data.length < 1000) break;
  }
  const slugs: string[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await client.from('products').select('slug, deleted').in('id', ids.slice(i, i + 300));
    for (const p of (data ?? []) as any[]) if (!p.deleted) slugs.push(p.slug);
  }
  return slugs;
}
