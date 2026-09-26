import { createBrowserClient } from '@/utils/supabase/browser';
import categories from '@/utils/categories';
import { buildSitemapXml } from '@/utils/sitemap';

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
  return buildSitemapXml(
    tools,
    categories.map(c => c.name),
  );
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
