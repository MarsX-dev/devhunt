import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { judgeComment } from '@/utils/server/commentModeration';
import { reportBlockedEdit } from '@/utils/server/discord';
import { tooManyRequests, withinLimit } from '@/utils/server/rateLimit';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

const MAX_LENGTH = 5000;

// Authors edit their comments here (not straight from the browser), so an edit gets the same spam check
// as a new comment. An edit judged spam is shadow-blocked like a new one: the author gets their text
// back as if saved, everyone else keeps seeing the original.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  if (!(await withinLimit(`comment:${user.id}`, 20, 3600))) return tooManyRequests('You are editing too fast, please try again later.');

  const body = (await req.json().catch(() => ({}))) as { content?: string };
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) return NextResponse.json({ error: 'Please write a comment.' }, { status: 400 });
  if (content.length > MAX_LENGTH) return NextResponse.json({ error: 'That comment is too long.' }, { status: 400 });

  const { data: comment } = await serviceClient
    .from('comment')
    .select('id, user_id, product_id, deleted, content, products (id, name, slug, slogan, owner_id)')
    .eq('id', Number(params.id))
    .maybeSingle();
  const product = comment?.products as unknown as { id: number; name: string; slug: string; slogan: string | null; owner_id: string | null } | null;
  if (!comment || comment.deleted || comment.user_id !== user.id || !product) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
  if (content === comment.content) return NextResponse.json({ comment: { id: comment.id, content } });

  const { decision } = await judgeComment({ userId: user.id, product, content });
  if (decision.status === 'shadow') {
    const { data: profile } = await serviceClient.from('profiles').select('username').eq('id', user.id).maybeSingle();
    console.log(JSON.stringify({ event: 'comment_edit_shadow_blocked', user: user.id, comment: comment.id, reason: decision.reason }));
    await reportBlockedEdit({ kind: 'comment', username: profile?.username ?? null, toolName: product.name, toolSlug: product.slug, reason: decision.reason ?? 'spam', content });
    return NextResponse.json({ comment: { id: comment.id, content } });
  }

  const { error } = await serviceClient.from('comment').update({ content }).eq('id', comment.id).eq('user_id', user.id);
  if (error) {
    console.error('comment edit failed:', comment.id, error.message);
    return NextResponse.json({ error: 'Could not save the comment, please try again.' }, { status: 500 });
  }
  return NextResponse.json({ comment: { id: comment.id, content } });
}
