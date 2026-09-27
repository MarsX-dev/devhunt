import { createBrowserClient } from '@/utils/supabase/browser';
import { type ToolProfileData } from '@/utils/toolProfile';

export interface CompareTool {
  id: number;
  slug: string;
  name: string;
  logo_url: string | null;
  votes_count: number;
  launch_start: string | null;
  pricing: string | null;
}

export interface ToolProfileView {
  data: ToolProfileData;
  sources: string[];
  generated_at: string | null;
  compare: CompareTool[]; // the alternatives, in the profile's order
}

// A tool's ready profile (RLS only exposes ready ones) plus fresh data for its alternatives.
// null when there's none yet; the page then asks for one (components/ui/ToolProfile/RequestProfile).
export async function getToolProfile(productId: number): Promise<ToolProfileView | null> {
  const client = createBrowserClient();
  const { data: row } = await client
    .from('tool_profiles' as never)
    .select('data, sources, generated_at')
    .eq('product_id', productId)
    .maybeSingle();
  const profile = row as { data: ToolProfileData; sources: string[]; generated_at: string | null } | null;
  if (!profile?.data) return null;

  const ids = profile.data.alternatives.map(a => a.id);
  let compare: CompareTool[] = [];
  if (ids.length) {
    const { data } = await client
      .from('products')
      .select('id, slug, name, logo_url, votes_count, launch_start, deleted, product_pricing_types(title)')
      .in('id', ids);
    const byId = new Map(((data ?? []) as any[]).filter(p => !p.deleted).map(p => [p.id, p]));
    compare = ids
      .map(id => byId.get(id))
      .filter(Boolean)
      .map(p => ({ id: p.id, slug: p.slug, name: p.name, logo_url: p.logo_url, votes_count: p.votes_count, launch_start: p.launch_start, pricing: p.product_pricing_types?.title ?? null }));
  }
  return { ...profile, compare };
}
