import { describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock('@/utils/supabase/services/supabaseClient', () => ({ supabase: {} }));
const { formatStat, statItems } = await import('@/utils/siteStats');

describe('statItems', () => {
  it('shows all-time totals with how much each grew recently', () => {
    const items = statItems({ total_views: 24_127_478, views_today: 1200, tools_launched: 7036, tools_this_week: 20, users: 40183, users_today: 76 });
    expect(items.map(i => [i.label, i.value, i.delta, i.deltaLabel])).toEqual([
      ['impressions', 24_127_478, 1200, 'today'],
      ['domain_rating', '65', undefined, undefined],
      ['tools_launched', 7036, 20, 'this week'],
      ['developers', 40183, 76, 'today'],
    ]);
  });
});

describe('formatStat', () => {
  it('keeps smaller numbers exact and shortens large ones', () => {
    expect(formatStat(7036)).toBe('7,036');
    expect(formatStat(40179)).toBe('40,179');
    expect(formatStat(24_127_478)).toBe('24.1M');
  });
});
