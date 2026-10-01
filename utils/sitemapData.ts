import { createBrowserClient } from '@/utils/supabase/browser';
import { comparisonPairs, toolsWithAlternatives } from '@/utils/compareData';
import { comparePath } from '@/utils/compare';
import { alternativesIndexable, compareIndexable } from '@/utils/seoIndex';
import { type SitemapEntry, type SitemapTool, toolPath } from '@/utils/sitemap';

// Supabase returns at most 1,000 rows per request, so fetch in pages.
const PAGE_SIZE = 1000;

export async function getLiveTools(): Promise<SitemapTool[]> {
  const supabase = createBrowserClient();
  const tools: SitemapTool[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('products')
      .select('slug, updated_at, profiles (username)')
      .eq('deleted', false)
      // Launched tools and paid listings; the free queue years ahead would be thin, unlaunched pages.
      .or(`launch_start.lte.${new Date().toISOString()},isPaid.eq.true`)
      .order('id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    tools.push(
      ...(data ?? []).map((t: any) => ({ slug: t.slug as string, username: (t.profiles?.username as string) ?? null, updated_at: t.updated_at as string | null })),
    );
    if (!data || data.length < PAGE_SIZE) break;
  }
  return tools;
}

// Alternatives pages and comparisons the page metadata leaves indexable (utils/seoIndex.ts), for live tools only.
export async function getProgrammaticEntries(liveSlugs: Set<string>): Promise<SitemapEntry[]> {
  const [alternatives, pairs] = await Promise.all([toolsWithAlternatives(), comparisonPairs()]);
  return [
    ...alternatives.filter(t => liveSlugs.has(t.slug) && alternativesIndexable(t)).map(t => ({ path: `${toolPath(t.slug)}/alternatives` })),
    ...pairs.filter(([a, b]) => liveSlugs.has(a.slug) && liveSlugs.has(b.slug) && compareIndexable(a, b)).map(([a, b]) => ({ path: comparePath(a.slug, b.slug) })),
  ];
}
