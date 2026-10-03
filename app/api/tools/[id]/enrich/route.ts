import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { enrichTool, enrichmentEnabled } from '@/utils/server/enrich';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MIN_HOURS_BETWEEN_RUNS = 1;

// Searches the web for the owner's (paid) tool and stores what it finds as pending items for the
// owner to approve or hide. Existing items keep their status; re-runs only add new findings.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!enrichmentEnabled()) return NextResponse.json({ error: 'Not configured.' }, { status: 503 });

  const { data: product } = await serviceClient
    .from('products')
    .select('id, name, demo_url, owner_id, isPaid, deleted, enriched_at')
    .eq('id', Number(params.id))
    .maybeSingle();
  const tool = product as { id: number; name: string; demo_url: string | null; owner_id: string; isPaid: boolean; deleted: boolean; enriched_at: string | null } | null;
  if (!tool || tool.deleted || tool.owner_id !== user.id) return NextResponse.json({ error: 'Tool not found.' }, { status: 404 });
  if (!tool.isPaid) return NextResponse.json({ error: 'Rich launch pages come with paid launches.' }, { status: 402 });
  if (tool.enriched_at && Date.now() - Date.parse(tool.enriched_at) < MIN_HOURS_BETWEEN_RUNS * 3600_000) {
    return NextResponse.json({ error: 'We searched recently. Please try again in an hour.' }, { status: 429 });
  }

  try {
    const { items, stats } = await enrichTool(tool);
    if (items.length) {
      await serviceClient.from('tool_enrichments' as never).upsert(
        items.map(item => ({ product_id: tool.id, kind: item.kind, title: item.title, body: item.body ?? null, url: item.url ?? null, source: item.source ?? null, meta: item.meta ?? {} })) as never,
        { onConflict: 'product_id,kind,title', ignoreDuplicates: true },
      );
    }
    await serviceClient.from('products').update({ enriched_at: new Date().toISOString() } as never).eq('id', tool.id);
    console.log(JSON.stringify({ event: 'tool_enrich', tool: tool.id, found: items.length, ...stats }));
    return NextResponse.json({ found: items.length });
  } catch (err) {
    console.error('tool enrich failed:', tool.id, (err as Error).message);
    return NextResponse.json({ error: "We couldn't search the web right now. Please try again later." }, { status: 502 });
  }
}
