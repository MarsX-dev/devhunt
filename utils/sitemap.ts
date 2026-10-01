export const SITE_URL = 'https://devhunt.org';
export const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

export const STATIC_PATHS = [
  '',
  '/upcoming',
  '/all-dev-tools',
  '/the-story',
  '/faq',
  '/stats',
  '/advertise',
  '/blog',
  '/oss-friends',
  '/best-dev-tools-this-week-on-product-hunt',
];

// The parts of /sitemap.xml (a sitemap index). Separate files give Search Console indexing numbers per page type.
export const SITEMAP_FILES = ['pages', 'tools', 'compare'] as const;
export type SitemapFile = (typeof SITEMAP_FILES)[number];

export interface SitemapTool {
  slug: string;
  username: string | null;
  updated_at?: string | null;
}

export interface SitemapEntry {
  path: string;
  lastmod?: string | null;
}

export const categoryPath = (name: string) => `/tools/${encodeURIComponent(name.toLowerCase().replaceAll(' ', '-'))}`;

// Paths arrive URL-encoded, which also keeps characters like '&' from breaking the XML.
const lastmodTag = (lastmod?: string | null) => (lastmod && !isNaN(Date.parse(lastmod)) ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '');

export function urlsetXml(entries: SitemapEntry[]): string {
  const urls = entries.map(e => `<url><loc>${SITE_URL}${e.path}</loc>${lastmodTag(e.lastmod)}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n${urls.join('\n')}\n</urlset>\n`;
}

export function sitemapIndexXml(locs: string[]): string {
  const items = locs.map(loc => `<sitemap><loc>${loc}</loc></sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${SITEMAP_NAMESPACE}">\n${items.join('\n')}\n</sitemapindex>\n`;
}

export const toolPath = (slug: string) => `/tool/${encodeURIComponent(slug)}`;

// Static pages, categories and makers' profiles. Only makers: the ~40k empty profiles would just be thin pages.
export function pagesEntries(tools: SitemapTool[], categoryNames: string[]): SitemapEntry[] {
  const usernames = Array.from(new Set(tools.map(t => t.username).filter((u): u is string => !!u)));
  return [
    ...STATIC_PATHS.map(path => ({ path })),
    ...categoryNames.map(name => ({ path: categoryPath(name) })),
    ...usernames.map(username => ({ path: `/@${encodeURIComponent(username)}` })),
  ];
}

export const toolEntries = (tools: SitemapTool[]): SitemapEntry[] => tools.map(t => ({ path: toolPath(t.slug), lastmod: t.updated_at }));
