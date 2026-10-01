import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import { FREE_ALTERNATIVES, MIN_ALTERNATIVES, allFreeSlugs, type FreeAlternative, type FreeAlternativeRow } from '@/utils/freeAlternatives';

export interface FreeTool {
  id: number;
  slug: string;
  name: string;
  slogan: string | null;
  logo_url: string | null;
  votes_count: number;
}

export interface FreeRowView {
  row: FreeAlternativeRow;
  tool: FreeTool;
  alternatives: (FreeAlternative & { tool: FreeTool })[];
}

// One query for every tool in the matrix, cached for an hour (the list is curated; only names/logos/votes move).
const getFreeTools = unstable_cache(
  async (): Promise<FreeTool[]> => {
    const { data } = await createBrowserClient()
      .from('products')
      .select('id, slug, name, slogan, logo_url, votes_count')
      .in('slug', allFreeSlugs())
      .eq('deleted', false)
      .eq('moderation', 'ok');
    return ((data ?? []) as any[]).map(p => ({ ...p, votes_count: p.votes_count ?? 0 }));
  },
  ['free-alternatives-tools'],
  { revalidate: 3600 },
);

// Rows with the tools that exist on DevHunt; a row needs its paid tool and at least MIN_ALTERNATIVES alternatives.
export async function getFreeRows(): Promise<FreeRowView[]> {
  const bySlug = new Map((await getFreeTools()).map(t => [t.slug, t]));
  const rows: FreeRowView[] = [];
  for (const row of FREE_ALTERNATIVES) {
    const tool = bySlug.get(row.slug);
    if (!tool) continue;
    const alternatives = row.alternatives.flatMap(a => (bySlug.has(a.slug) ? [{ ...a, tool: bySlug.get(a.slug)! }] : []));
    if (alternatives.length >= MIN_ALTERNATIVES) rows.push({ row, tool, alternatives });
  }
  return rows;
}

export async function getFreeRow(slug: string): Promise<FreeRowView | null> {
  return (await getFreeRows()).find(r => r.row.slug === slug) ?? null;
}
