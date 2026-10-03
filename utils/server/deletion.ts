import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { anonymizedProfile } from '@/utils/deletion';

// Server-only (service role). Callers must have checked who is allowed to delete what.

const BAN = '876000h'; // ~100 years: the account can't sign in or sign up again

async function notify(content: string) {
  const webhook = process.env.DISCORD_TOOL_WEBHOOK ?? process.env.DISCOR_TOOL_WEBHOOK;
  if (!webhook) return;
  await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, allowed_mentions: { parse: [] } }) }).catch(() => {});
}

// Soft-deletes a tool after saving a full snapshot (row + categories) for a possible restore.
export async function deleteTool(productId: number, actorId: string, reason = 'deleted by owner', silent = false) {
  const { data: product } = await serviceClient.from('products').select('*').eq('id', productId).maybeSingle();
  if (!product || product.deleted) return { ok: false as const, error: 'Tool not found.' };
  const { data: categories } = await serviceClient.from('product_category_product').select('category_id').eq('product_id', productId);
  const { error: snapError } = await serviceClient.from('deleted_records' as never).insert({
    kind: 'product',
    record_id: String(productId),
    owner_id: product.owner_id,
    deleted_by: actorId,
    reason,
    data: { product, category_ids: (categories ?? []).map((c: any) => c.category_id) },
  } as never);
  if (snapError) return { ok: false as const, error: `snapshot failed: ${snapError.message}` };
  const { error } = await serviceClient.from('products').update({ deleted: true, deleted_at: new Date().toISOString() } as never).eq('id', productId);
  if (error) return { ok: false as const, error: error.message };
  if (!silent) await notify(`🗑️ **${product.name}** was deleted by its owner (${reason}). Restore: \`UPDATE products SET deleted = false, deleted_at = NULL WHERE id = ${productId};\``);
  return { ok: true as const };
}

// Deletes an account: snapshot, delete their tools, anonymize the profile, ban the auth user
// (no sign-in or sign-up with the same identity) and end their sessions.
export async function deleteAccount(userId: string, accessToken: string | null, reason = 'deleted by the user') {
  const [{ data: profile }, { data: auth }, { data: products }] = await Promise.all([
    serviceClient.from('profiles').select('*').eq('id', userId).maybeSingle(),
    serviceClient.auth.admin.getUserById(userId),
    serviceClient.from('products').select('id, name, deleted').eq('owner_id', userId),
  ]);
  if (!profile || (profile as any).deleted_at) return { ok: false as const, error: 'Account not found.' };
  const authUser = auth?.user;

  const { error: snapError } = await serviceClient.from('deleted_records' as never).insert({
    kind: 'profile',
    record_id: userId,
    owner_id: userId,
    deleted_by: userId,
    reason,
    data: {
      profile,
      auth: authUser
        ? { email: authUser.email, created_at: authUser.created_at, last_sign_in_at: authUser.last_sign_in_at, providers: authUser.app_metadata?.providers, user_metadata: authUser.user_metadata }
        : null,
      product_ids: (products ?? []).map((p: any) => p.id),
    },
  } as never);
  if (snapError) return { ok: false as const, error: `snapshot failed: ${snapError.message}` };

  const live = (products ?? []).filter((p: any) => !p.deleted);
  for (const p of live) await deleteTool(p.id, userId, 'account deleted', true);

  const { error: profileError } = await serviceClient.from('profiles').update(anonymizedProfile(userId) as never).eq('id', userId);
  if (profileError) return { ok: false as const, error: profileError.message };

  const { error: banError } = await serviceClient.auth.admin.updateUserById(userId, { ban_duration: BAN });
  if (banError) console.error('ban failed:', userId, banError.message);
  if (accessToken) await serviceClient.auth.admin.signOut(accessToken, 'global').catch(() => null);

  await notify(
    `👋 **${profile.full_name || profile.username}** (@${profile.username}) deleted their account${live.length ? ` and ${live.length} tool${live.length === 1 ? '' : 's'}` : ''}. The snapshot is in deleted_records.`,
  );
  return { ok: true as const, tools: live.length };
}
