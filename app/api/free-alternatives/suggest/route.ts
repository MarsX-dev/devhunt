import { NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase/server';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

const DAILY_LIMIT = 10;
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// A signed-in user suggests a free alternative for /free-alternatives; reviewed by hand (status 'new').
export async function POST(req: Request) {
  const {
    data: { user },
  } = await createServerClient().auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to suggest a tool' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const paid = clean(body.paid_tool, 80);
  const alternative = clean(body.alternative, 80);
  const url = clean(body.url, 300) || null;
  const note = clean(body.note, 500) || null;
  if (!paid || !alternative) return NextResponse.json({ error: 'Name the paid tool and the free alternative' }, { status: 400 });
  if (url && !/^https?:\/\/\S+$/i.test(url)) return NextResponse.json({ error: 'The link must start with http(s)://' }, { status: 400 });

  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await serviceClient
    .from('free_alternative_suggestions' as never)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since);
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: 'Thanks! That is enough for today.' }, { status: 429 });

  const { error } = await serviceClient
    .from('free_alternative_suggestions' as never)
    .insert({ user_id: user.id, paid_tool: paid, alternative, url, note } as never);
  if (error) return NextResponse.json({ error: 'Could not save, try again' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
