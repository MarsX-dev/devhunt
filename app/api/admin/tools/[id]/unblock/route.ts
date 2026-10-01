import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/utils/server/admin';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { logModeration } from '@/utils/server/moderationLog';
import { createServerClient } from '@/utils/supabase/server';
import { cache } from '@/utils/supabase/services/CacheService';

export const dynamic = 'force-dynamic';

// DevHunt team: make a blocked tool public again (what the Discord alert's SQL did by hand).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const { data, error } = await serviceClient
    .from('products')
    .update({ moderation: 'ok', moderation_reason: null, deleted: false } as never)
    .eq('id', id)
    .eq('moderation' as never, 'blocked')
    .select('id, name, slug, demo_url')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not blocked' }, { status: 409 });

  const tool = data as { id: number; name: string; slug: string; demo_url: string | null };
  const {
    data: { user },
  } = await createServerClient().auth.getUser();
  await logModeration({ kind: 'tool_submission', action: 'unblocked', subject: tool.name, url: tool.demo_url, userId: user?.id ?? null, productId: tool.id });
  cache.del(`product-details-slug-${tool.slug}`);
  revalidatePath(`/tool/${tool.slug}`);
  return NextResponse.json({ ok: true, slug: tool.slug });
}
