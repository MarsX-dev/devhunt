export const SITE_URL = 'https://devhunt.org';
export const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

const STATIC_PATHS = ['', '/upcoming', '/all-dev-tools', '/the-story', '/faq', '/stats', '/blog', '/oss-friends', '/best-dev-tools-this-week-on-product-hunt'];

export interface SitemapTool {
  slug: string;
  username: string | null;
}

const urlEntry = (loc: string) => `<url><loc>${loc}</loc></url>`;

export const categoryPath = (name: string) => `/tools/${encodeURIComponent(name.toLowerCase().replaceAll(' ', '-'))}`;

// Path segments are URL-encoded, which also keeps characters like '&' from breaking the XML.
export function buildSitemapXml(tools: SitemapTool[], categoryNames: string[], extraPaths: string[] = []): string {
  // Only makers' profiles: the ~40k empty profiles would just be thin pages.
  const usernames = Array.from(new Set(tools.map(t => t.username).filter((u): u is string => !!u)));

  const urls = [
    ...STATIC_PATHS.map(path => urlEntry(`${SITE_URL}${path}`)),
    ...tools.map(({ slug }) => urlEntry(`${SITE_URL}/tool/${encodeURIComponent(slug)}`)),
    ...categoryNames.map(name => urlEntry(`${SITE_URL}${categoryPath(name)}`)),
    ...usernames.map(username => urlEntry(`${SITE_URL}/@${encodeURIComponent(username)}`)),
    ...extraPaths.map(path => urlEntry(`${SITE_URL}${path}`)),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n${urls.join('\n')}\n</urlset>\n`;
}
