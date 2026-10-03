import { createBrowserClient } from '@/utils/supabase/browser';

export interface ToolExtra {
  id: number;
  kind: 'award' | 'review' | 'mention' | 'highlight';
  title: string;
  body: string | null;
  url: string | null;
  source: string | null;
}

// Approved "rich launch page" items for a tool (public; RLS only returns approved rows to visitors).
// Not cached, so an owner sees their approvals on the page right away (small indexed query).
export async function getToolExtras(productId: number): Promise<ToolExtra[]> {
  const { data } = await createBrowserClient()
    .from('tool_enrichments' as never)
    .select('id, kind, title, body, url, source')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('id', { ascending: true });
  return (data ?? []) as ToolExtra[];
}
