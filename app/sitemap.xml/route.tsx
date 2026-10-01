import { SITE_URL, SITEMAP_FILES, sitemapIndexXml } from '@/utils/sitemap';

// A sitemap index: one file per page type (app/sitemaps/[file]) plus the blog's own sitemap.
export const revalidate = 3600;

export async function GET() {
  const body = sitemapIndexXml([...SITEMAP_FILES.map(file => `${SITE_URL}/sitemaps/${file}.xml`), `${SITE_URL}/blog/sitemap.xml`]);
  return new Response(body, {
    status: 200,
    headers: {
      'Cache-control': 'public, s-maxage=86400, stale-while-revalidate',
      'content-type': 'application/xml',
    },
  });
}
