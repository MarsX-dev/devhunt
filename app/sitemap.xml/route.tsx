import { createBrowserClient } from '@/utils/supabase/browser';
import categories from '@/utils/categories';

const URL = 'https://devhunt.org';

// Regenerate hourly instead of once per build.
export const revalidate = 3600;

// Supabase returns at most 1,000 rows per request, so fetch in pages.
const PAGE_SIZE = 1000;

async function getLiveTools() {
  const supabase = createBrowserClient();
  const tools: { slug: string; username: string | null }[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('products')
      .select('slug, profiles (username)')
      .eq('deleted', false)
      .order('id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    tools.push(...(data ?? []).map((t: any) => ({ slug: t.slug as string, username: (t.profiles?.username as string) ?? null })));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return tools;
}

async function generateSiteMap() {
  const tools = await getLiveTools();
  // Only makers' profiles: the ~40k empty profiles would just be thin pages.
  const profiles = Array.from(new Set(tools.map(t => t.username).filter(Boolean))).map(username => ({ username }));
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>${URL}</loc>
    </url>
    <url>
      <loc>${URL}/the-story</loc>
    </url>
    <url>
      <loc>https://devhunt.org/blog</loc>
    </url>
    <url>
      <loc>https://devhunt.org/best-dev-tools-this-week-on-product-hunt</loc>
    </url>
     ${
       tools &&
       tools
         .map(({ slug }) => {
           return `
           <url>
               <loc>${`${URL}/tool/${encodeURIComponent(slug)}`}</loc>
           </url>
         `;
         })
         .join('')
     }
     ${categories
       .map(slug => {
         return `
          <url>
              <loc>${`${URL}/tools/${slug.name.toLowerCase().replaceAll(' ', '-')}`}</loc>
          </url>
        `;
       })
       .join('')}
     ${
       profiles &&
       profiles
         .map(({ username }) => {
           return `
          <url>
              <loc>${`${URL}/@${encodeURIComponent(username as string)}`}</loc>
          </url>
        `;
         })
         .join('')
     }
   </urlset>
 `;
}

export async function GET() {
  const body = await generateSiteMap();

  return new Response(body, {
    status: 200,
    headers: {
      'Cache-control': 'public, s-maxage=86400, stale-while-revalidate',
      'content-type': 'application/xml',
    },
  });
}
