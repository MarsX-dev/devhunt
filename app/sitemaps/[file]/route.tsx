import categories from '@/utils/categories';
import { type SitemapFile, SITEMAP_FILES, pagesEntries, toolEntries, urlsetXml } from '@/utils/sitemap';
import { getLiveTools, getProgrammaticEntries } from '@/utils/sitemapData';

// The parts of the /sitemap.xml index: /sitemaps/pages.xml, /sitemaps/tools.xml, /sitemaps/compare.xml.
// Regenerated hourly instead of once per build.
export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() {
  return SITEMAP_FILES.map(file => ({ file: `${file}.xml` }));
}

async function entries(file: SitemapFile) {
  const tools = await getLiveTools();
  if (file === 'pages') return pagesEntries(tools, categories.map(c => c.name));
  if (file === 'tools') return toolEntries(tools);
  return await getProgrammaticEntries(new Set(tools.map(t => t.slug)));
}

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const file = params.file.replace(/\.xml$/, '') as SitemapFile;
  if (!SITEMAP_FILES.includes(file)) return new Response('Not found', { status: 404 });
  return new Response(urlsetXml(await entries(file)), {
    status: 200,
    headers: {
      'Cache-control': 'public, s-maxage=86400, stale-while-revalidate',
      'content-type': 'application/xml',
    },
  });
}
