import { describe, expect, it } from 'vitest';
import { toToolCardProps } from '@/utils/toolCard';

const fullRow = {
  id: 1, slug: 'x', name: 'X', slogan: 's', description: '<p>d</p>', logo_url: 'l', demo_url: 'https://x.dev', demo_video_url: 'v',
  asset_urls: ['a'], owner_id: 'u', launch_date: '2026-09-29', launch_end: '2026-10-05T23:59:59Z', views_count: 5, votes_count: 3,
  product_pricing_types: { id: 1, title: 'Free', created_at: 't' },
  product_categories: [{ id: 2, name: 'AI', created_at: 't', updated_at: 't' }],
  // Not needed by cards or the preview modal:
  created_at: 't', updated_at: 't', github_url: 'g', paid_launch_date: { week: 1 }, isPaid: true, launch_start: 't', week: 39,
  comments_count: 0, pricing_type: 1, deleted: false, deleted_at: null, is_draft: false,
};

describe('toToolCardProps', () => {
  const props = toToolCardProps(fullRow) as any;

  it('keeps everything the card and the preview modal read', () => {
    for (const key of ['id', 'slug', 'name', 'slogan', 'description', 'logo_url', 'demo_url', 'demo_video_url', 'asset_urls', 'owner_id', 'launch_date', 'launch_end', 'views_count', 'votes_count']) {
      expect(props[key]).toEqual((fullRow as any)[key]);
    }
    expect(props.product_pricing_types).toEqual({ title: 'Free' });
    expect(props.product_categories).toEqual([{ id: 2, name: 'AI' }]);
  });

  it('drops fields that only bloat the page', () => {
    for (const key of ['created_at', 'updated_at', 'github_url', 'paid_launch_date', 'comments_count', 'deleted']) {
      expect(props).not.toHaveProperty(key);
    }
  });

  it('keeps isPaid: outbound links are followed only for paid launches', () => {
    expect(typeof props.isPaid).toBe('boolean');
  });

  it('handles missing pricing and categories', () => {
    const p = toToolCardProps({ ...fullRow, product_pricing_types: null, product_categories: null }) as any;
    expect(p.product_pricing_types).toBeNull();
    expect(p.product_categories).toEqual([]);
  });
});
