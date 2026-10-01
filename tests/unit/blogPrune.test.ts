import { describe, expect, it } from 'vitest';
import prune from '@/utils/blogPrune.json';
import { blogIndexable, blogNoindex, blogRedirect } from '@/utils/blogPrune';

const redirects: Record<string, string> = prune.redirects;

describe('blog prune data', () => {
  it('redirects straight to a live, indexable post (no chains, no loops)', () => {
    for (const [from, to] of Object.entries(redirects)) {
      expect(to).not.toBe(from);
      expect(redirects[to]).toBeUndefined();
      expect(blogNoindex(to)).toBe(false);
    }
  });

  it('never both redirects and noindexes a post', () => {
    for (const slug of prune.noindex) expect(blogRedirect(slug)).toBeUndefined();
  });

  it('keeps merged and noindexed posts out of the sitemap', () => {
    expect(blogIndexable('supabase-rest-api-basics')).toBe(false);
    expect(blogIndexable(prune.noindex[0])).toBe(false);
    expect(blogIndexable('supabase-rest-api-quickstart')).toBe(true);
  });
});
