import { withBlogSeo } from '@/utils/blogSeo';
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

describe('withBlogSeo', () => {
  const post = { headline: 'Old', metaDescription: 'old', html: '<h1 id="x">Old</h1><p>Body</p><h1>Second</h1>' };
  it('overrides headline, description and only the first h1', () => {
    const p = withBlogSeo('google-map-api-for-developers-integration-basics', post);
    expect(p.headline).toMatch(/^Google Maps API/);
    expect(p.metaDescription).toMatch(/API key/);
    expect(p.html).toBe(`<h1 id="x">${p.headline}</h1><p>Body</p><h1>Second</h1>`);
  });
  it('leaves other posts alone', () => {
    expect(withBlogSeo('some-other-post', post)).toBe(post);
  });
});
