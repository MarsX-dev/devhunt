import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { type Database } from '@/utils/supabase/types';

// Only announce tools submitted in the last few minutes, so the endpoint can't be replayed.
const FRESH_SUBMISSION_MS = 10 * 60 * 1000;

// Called by the submit form after a tool is created: posts the Discord new-tool message.
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId } = (await req.json().catch(() => ({}))) as { productId?: number };
  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });

  const { data: product } = await supabase
    .from('products')
    .select('name, slug, owner_id, created_at')
    .eq('id', productId)
    .single();
  if (!product || product.owner_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (Date.now() - new Date(product.created_at as string).getTime() > FRESH_SUBMISSION_MS) {
    return NextResponse.json({ data: 'skipped' });
  }

  // DISCOR_TOOL_WEBHOOK is the historical (misspelled) name; keep reading it so an existing env var still works.
  const webhook = process.env.DISCORD_TOOL_WEBHOOK ?? process.env.DISCOR_TOOL_WEBHOOK;
  if (webhook) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**${product.name}** by ${profile?.full_name ?? 'someone'} [open the tool](https://devhunt.org/tool/${product.slug})`,
      }),
    }).catch((err: Error) => console.error('Discord new-tool webhook failed:', err.message));
  }

  return NextResponse.json({ data: 'ok' });
}
