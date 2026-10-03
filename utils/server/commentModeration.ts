import { moderateComment } from '@/utils/server/jev';
import { commentDecision, isLinkDrop, templateRepeats, type CommentModeration } from '@/utils/moderation';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// Spam check for a comment's text, the same for new comments and edits (see commentDecision).
// Owners commenting on their own tool are never blocked.
export async function judgeComment(input: {
  userId: string;
  product: { id: number; name: string; slogan: string | null; owner_id: string | null };
  content: string;
}): Promise<{ decision: CommentModeration; score: number | null }> {
  const isOwner = input.product.owner_id === input.userId;
  if (isOwner) return { decision: commentDecision({ isOwner, repeats: 0, linkDrop: false, spamProbability: null, choice: null }), score: null };

  const [{ data: previous }, jev] = await Promise.all([
    serviceClient
      .from('comment')
      .select('content, products (name)')
      .eq('user_id', input.userId)
      .neq('product_id', input.product.id)
      .order('created_at', { ascending: false })
      .limit(30),
    moderateComment({ toolName: input.product.name, toolSlogan: input.product.slogan, content: input.content }),
  ]);
  const others = (previous ?? []).map((c: any) => ({ content: c.content as string, toolName: (c.products?.name as string) ?? '' }));
  const decision = commentDecision({
    isOwner,
    repeats: templateRepeats(input.content, input.product.name, others),
    linkDrop: isLinkDrop(input.content),
    spamProbability: jev.spamProbability,
    choice: jev.choice,
  });
  return { decision, score: jev.spamProbability };
}
