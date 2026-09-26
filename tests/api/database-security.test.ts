import { describe, expect, it } from 'vitest';
import { SOME_PRODUCT_ID, SOME_USER_ID, supabase } from './helpers';

// Every call here must be rejected (or be a plain read); none of them may change data.
const rejected = (status: number) => [401, 403].includes(status);

describe('database security (anonymous API key)', () => {
  it('cannot vote on behalf of a user', async () => {
    const res = await supabase('rpc/toggleProductVote', {
      method: 'POST',
      body: JSON.stringify({ _product_id: SOME_PRODUCT_ID, _user_id: SOME_USER_ID }),
    });
    expect(rejected(res.status)).toBe(true);
  });

  it('cannot like a comment on behalf of a user', async () => {
    const res = await supabase('rpc/toggleCommentVote', { method: 'POST', body: JSON.stringify({ _comment_id: 1, _user_id: SOME_USER_ID }) });
    expect(rejected(res.status)).toBe(true);
  });

  it('cannot read user emails', async () => {
    const res = await supabase('rpc/get_user_emails_by_ids', { method: 'POST', body: JSON.stringify({ user_ids: [SOME_USER_ID] }) });
    expect(rejected(res.status)).toBe(true);
    expect(await res.text()).not.toContain('@');
  });

  it.each(['handle_new_user', 'update_product_launch_time', 'sync_product_comments_count', 'sync_product_votes_count'])(
    'cannot call trigger function %s',
    async fn => {
      const res = await supabase(`rpc/${fn}`, { method: 'POST', body: '{}' });
      expect(res.ok).toBe(false);
    },
  );

  it.each([
    ['comment', { content: 'x', user_id: SOME_USER_ID, product_id: SOME_PRODUCT_ID }],
    ['comment_vote', { comment_id: 1, user_id: SOME_USER_ID }],
    ['product_votes', { product_id: SOME_PRODUCT_ID, user_id: SOME_USER_ID }],
    ['products', { name: 'x', slug: 'qa-anon-probe', owner_id: SOME_USER_ID }],
    ['product_category_product', { product_id: SOME_PRODUCT_ID, category_id: 1 }],
  ])('cannot insert into %s', async (table, row) => {
    const res = await supabase(table, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
    expect(rejected(res.status)).toBe(true);
  });

  it.each(['get_site_stats', 'get_recent_activity', 'get_category_counts'])('cannot call the server-only function %s', async fn => {
    const res = await supabase(`rpc/${fn}`, { method: 'POST', body: '{}' });
    expect(res.ok).toBe(false);
  });

  it.each(['site_daily_views', 'payments', 'payment_events'])('cannot read or write server-only table %s', async table => {
    const read = await supabase(`${table}?select=*&limit=1`);
    expect(read.ok ? (await read.json()).length : 0).toBe(0);
    const write = await supabase(table, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: '{}' });
    expect(write.ok).toBe(false);
  });

  it('cannot update or delete products', async () => {
    const upd = await supabase(`products?id=eq.${SOME_PRODUCT_ID}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ slogan: 'x' }),
    });
    expect(upd.ok ? (await upd.json()).length : 0).toBe(0);
  });

  it.each(['weekly_rank', 'product_ranks', 'winner_of_the_week', 'product_votes_view'])('public view %s is still readable', async view => {
    const res = await supabase(`${view}?select=*&limit=1`);
    expect(res.status).toBe(200);
    expect((await res.json()).length).toBe(1);
  });

  it('counters match their source tables for a sample product', async () => {
    const [product] = await (await supabase(`products?id=eq.${SOME_PRODUCT_ID}&select=votes_count,comments_count`)).json();
    const votes = await supabase(`product_votes?product_id=eq.${SOME_PRODUCT_ID}&select=user_id`, {
      headers: { Prefer: 'count=exact', Range: '0-0' },
    });
    const total = Number(votes.headers.get('content-range')?.split('/')[1]);
    expect(product.votes_count).toBe(total);
  });
});
