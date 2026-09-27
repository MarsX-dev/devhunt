import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { reportShadowComment } from '@/utils/server/discord';
import { judgeComment } from '@/utils/server/commentModeration';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { tooManyRequests, withinLimit } from '@/utils/server/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_LENGTH = 5000;

// Posts a comment. Spam (see commentDecision) is shadow-blocked: the response looks exactly like a
// saved comment and the author keeps seeing it in their browser, but it's never stored, so nobody
// else sees it, no emails go out, and the spammer has no signal to work around.
export async function POST(req: Request) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  if (!(await withinLimit(`comment:${user.id}`, 20, 3600))) return tooManyRequests('You are commenting too fast, please try again later.');

  const body = (await req.json().catch(() => ({}))) as { slug?: string; content?: string };
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || !body.slug) return NextResponse.json({ error: 'Please write a comment.' }, { status: 400 });
  if (content.length > MAX_LENGTH) return NextResponse.json({ error: 'That comment is too long.' }, { status: 400 });

  const [{ data: product }, { data: profile }] = await Promise.all([
    serviceClient.from('products').select('id, name, slug, slogan, owner_id').eq('slug', body.slug).eq('deleted', false).maybeSingle(),
    serviceClient.from('profiles').select('full_name, avatar_url, username, deleted_at').eq('id', user.id).maybeSingle(),
  ]);
  if (!product) return NextResponse.json({ error: 'Tool not found.' }, { status: 404 });
  if (!profile || profile.deleted_at) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const author = { full_name: profile.full_name, avatar_url: profile.avatar_url, username: profile.username };

  const { decision, score } = await judgeComment({ userId: user.id, product, content });

  if (decision.status === 'shadow') {
    // A plausible id (just past the newest real one) so the response is indistinguishable.
    const { data: last } = await serviceClient.from('comment').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    const fake = {
      id: (last?.id ?? 0) + 1 + Math.floor(Math.random() * 3),
      content,
      user_id: user.id,
      product_id: product.id,
      parent_id: null,
      created_at: new Date().toISOString(),
      deleted: false,
      votes_count: 0,
      profiles: author,
      children: [],
    };
    console.log(JSON.stringify({ event: 'comment_shadow_blocked', user: user.id, tool: product.id, reason: decision.reason, score }));
    await reportShadowComment({ username: profile.username, toolName: product.name, toolSlug: product.slug, reason: decision.reason ?? 'spam', score, content });
    return NextResponse.json({ comment: fake });
  }

  const { data: saved, error } = await serviceClient
    .from('comment')
    .insert({ content, user_id: user.id, product_id: product.id })
    .select('*, profiles (full_name, avatar_url, username)')
    .single();
  if (error || !saved) {
    console.error('comment insert failed:', error?.message);
    return NextResponse.json({ error: 'Could not post the comment, please try again.' }, { status: 500 });
  }
  return NextResponse.json({ comment: { ...saved, children: [] } });
}
