import { describe, expect, it, vi } from 'vitest';

// Fake Supabase query builder that records each product_votes query.
const queries: { userId: string; ids: number[] }[] = [];
vi.mock('@/utils/supabase/browser', () => ({
  createBrowserClient: () => ({
    from: () => {
      const q: { userId?: string } = {};
      const builder = {
        select: () => builder,
        eq: (_: string, userId: string) => ((q.userId = userId), builder),
        in: async (_: string, ids: number[]) => {
          queries.push({ userId: q.userId!, ids });
          return { data: ids.filter(id => id % 2 === 0).map(product_id => ({ product_id })) };
        },
      };
      return builder;
    },
  }),
}));
const { hasUserVoted } = await import('@/utils/userVotes');

describe('hasUserVoted', () => {
  it('answers all cards of one render with a single query', async () => {
    const answers = await Promise.all([1, 2, 3, 4, 2].map(id => hasUserVoted('u1', id)));
    expect(answers).toEqual([false, true, false, true, true]);
    expect(queries).toEqual([{ userId: 'u1', ids: [1, 2, 3, 4] }]);
  });

  it('splits very long lists into chunks', async () => {
    queries.length = 0;
    await Promise.all(Array.from({ length: 200 }, (_, i) => hasUserVoted('u1', i + 1)));
    expect(queries.map(q => q.ids.length)).toEqual([150, 50]);
  });
});
