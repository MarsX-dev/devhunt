import { unstable_cache } from 'next/cache';
import { BlogClient } from 'seobot';

// The SEObot API takes 6-8s per request, so cache its responses instead of calling it on every page view.
const BLOG_CACHE_SECONDS = 3600;

function client() {
  const key = process.env.SEOBOT_API_KEY;
  if (!key) throw Error('SEOBOT_API_KEY enviroment variable must be set');
  return new BlogClient(key);
}

export const getArticles = unstable_cache(async (page: number, limit: number) => await client().getArticles(page, limit), ['seobot-articles'], {
  revalidate: BLOG_CACHE_SECONDS,
});

export const getArticle = unstable_cache(async (slug: string) => await client().getArticle(slug), ['seobot-article'], {
  revalidate: BLOG_CACHE_SECONDS,
});

export const getCategoryArticles = unstable_cache(
  async (slug: string, page: number, limit: number) => await client().getCategoryArticles(slug, page, limit),
  ['seobot-category-articles'],
  { revalidate: BLOG_CACHE_SECONDS },
);

export const getTagArticles = unstable_cache(
  async (slug: string, page: number, limit: number) => await client().getTagArticles(slug, page, limit),
  ['seobot-tag-articles'],
  { revalidate: BLOG_CACHE_SECONDS },
);
