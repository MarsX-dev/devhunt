import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// Every moderation decision that stopped or downgraded something, for /admin/analytics (the matching
// Discord alert is sent by the caller). Never throws: logging must not break the request.
export type ModerationKind = 'tool_submission' | 'tool_edit' | 'comment' | 'comment_edit' | 'ad' | 'ad_edit';
export type ModerationAction = 'refused' | 'blocked' | 'not_a_fit' | 'shadow' | 'unblocked'; // unblocked: by the team

export async function logModeration(entry: {
  kind: ModerationKind;
  action: ModerationAction;
  reason?: string | null;
  subject?: string | null;
  url?: string | null;
  userId?: string | null;
  productId?: number | null;
  score?: number | null;
  details?: Record<string, unknown>;
}) {
  try {
    const { error } = await serviceClient.from('moderation_log' as never).insert({
      kind: entry.kind,
      action: entry.action,
      reason: entry.reason ?? null,
      subject: entry.subject?.slice(0, 200) ?? null,
      url: entry.url?.slice(0, 500) ?? null,
      user_id: entry.userId ?? null,
      product_id: entry.productId ?? null,
      score: entry.score ?? null,
      details: entry.details ?? {},
    } as never);
    if (error) console.error('moderation log failed:', error.message);
  } catch (err) {
    console.error('moderation log failed:', (err as Error).message);
  }
}
