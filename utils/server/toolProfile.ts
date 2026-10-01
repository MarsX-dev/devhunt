import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { groqJson } from '@/utils/server/enrich';
import {
  PROFILE_PROMPT,
  cleanMarkdown,
  pickGithubRepo,
  pickPages,
  profileInput,
  validateProfile,
  type Candidate,
  type GithubStats,
} from '@/utils/toolProfile';

// Env (server-only): FIRECRAWL_KEY (reads the tool's site), GROQ_API_KEY (writes the fact sheet),
// optional GITHUB_TOKEN (higher GitHub API rate limit).
const FIRECRAWL_KEY = () => process.env.FIRECRAWL_KEY || process.env.FIRECRAWL_API_KEY;
export const profilesEnabled = () => !!(FIRECRAWL_KEY() && process.env.GROQ_API_KEY);

const OTHER_CATEGORY = 'Other';
const addHttps = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

async function scrape(url: string, withLinks: boolean) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: withLinks ? ['markdown', 'links'] : ['markdown'], onlyMainContent: true, timeout: 20000 }),
    signal: AbortSignal.timeout(25000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.success) throw new Error(`firecrawl ${res.status}: ${body?.error ?? 'scrape failed'}`);
  if (Number(body.data?.metadata?.statusCode) >= 400) throw new Error(`page ${body.data.metadata.statusCode}`);
  return { markdown: String(body.data?.markdown ?? ''), links: (body.data?.links ?? []) as string[] };
}

export async function githubStats(repo: string | null): Promise<GithubStats | null> {
  if (!repo) return null;
  try {
    const headers = { Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const r = await res.json();
    if (r.private || r.archived) return null;
    const releases = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=3`, { headers, signal: AbortSignal.timeout(8000) })
      .then(res => (res.ok ? res.json() : []))
      .catch(() => []);
    return {
      repo: r.full_name,
      stars: r.stargazers_count ?? 0,
      forks: r.forks_count ?? 0,
      license: r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : null,
      language: r.language ?? null,
      pushed_at: r.pushed_at ?? null,
      releases: (Array.isArray(releases) ? releases : [])
        .filter((rel: any) => !rel.draft && rel.published_at)
        .map((rel: any) => ({ tag: String(rel.tag_name).slice(0, 40), name: rel.name ? String(rel.name).slice(0, 80) : null, published_at: rel.published_at, url: rel.html_url })),
    };
  } catch {
    return null;
  }
}

// The most upvoted launched tools that share a category with this one.
async function candidatesFor(productId: number, categoryIds: number[]): Promise<Candidate[]> {
  if (!categoryIds.length) return [];
  const { data } = await serviceClient
    .from('products')
    .select('id, name, slogan, product_category_product!inner(category_id)')
    .in('product_category_product.category_id', categoryIds)
    .eq('deleted', false)
    .eq('moderation', 'ok')
    .eq('site_status', 'ok')
    .neq('id', productId)
    .or('launch_start.not.is.null,is_reference.eq.true') // launched tools and DevHunt's reference listings
    .order('votes_count', { ascending: false })
    .limit(40);
  const seen = new Set<number>();
  return ((data ?? []) as any[]).filter(p => !seen.has(p.id) && seen.add(p.id)).map(p => ({ id: p.id, name: p.name, slogan: p.slogan }));
}

type Tool = { id: number; name: string; slogan: string | null; description: string | null; demo_url: string | null; github_url: string | null };

// Builds and stores the profile for one tool. The caller must have claimed it (claim_tool_profile).
export async function generateToolProfile(tool: Tool): Promise<{ status: 'ready' | 'failed'; error?: string }> {
  const save = async (fields: Record<string, unknown>) => {
    await serviceClient
      .from('tool_profiles' as never)
      .update({ ...fields, updated_at: new Date().toISOString() } as never)
      .eq('product_id', tool.id);
  };
  try {
    if (!tool.demo_url) throw new Error('no website');
    const site = addHttps(tool.demo_url.trim());
    const home = await scrape(site, true).catch(e => (/408|timed out/i.test(String(e)) ? scrape(site, true) : Promise.reject(e)));
    const picked = pickPages(home.links, site);
    const hasPricing = picked.some(u => /pric|plan/i.test(u));
    // Pricing links often sit in the (stripped) navigation: try /pricing when none was found.
    const [pricingUrl, featuresUrl] = hasPricing ? picked : [`${new URL(site).origin}/pricing`, picked[0]];
    const read = (max: number, url?: string) => (url ? scrape(url, false).then(p => ({ url, text: cleanMarkdown(p.markdown, max) })).catch(() => null) : null);
    const [pricingPage, featuresPage] = await Promise.all([read(16000, pricingUrl), read(6000, featuresUrl)]);
    const extra = [pricingPage, featuresPage].filter((p): p is { url: string; text: string } => !!p && p.text.length > 200);
    const pages = [{ url: site, text: cleanMarkdown(home.markdown, 12000) }, ...extra];

    const { data: cats } = await serviceClient.from('product_category_product').select('category_id, product_categories(name)').eq('product_id', tool.id);
    const categoryIds = ((cats ?? []) as any[]).filter(c => c.product_categories?.name !== OTHER_CATEGORY).map(c => c.category_id);
    const [candidates, github] = await Promise.all([candidatesFor(tool.id, categoryIds), githubStats(pickGithubRepo(tool.github_url, home.links, tool.name, site))]);

    const sourceText = [tool.name, tool.slogan, tool.description, ...pages.map(p => p.text)].join('\n');
    const pricingText = pricingPage && /pric|plan/i.test(pricingPage.url) ? pricingPage.text : '';
    // The model occasionally returns a thin answer; one retry fixes most of those.
    let data = null;
    for (let attempt = 0; attempt < 2 && !data; attempt++) {
      const raw = await groqJson(PROFILE_PROMPT, profileInput(tool, pages, candidates), 4000).catch(e => {
        if (/\b429\b/.test(String(e))) throw e; // rate limited: let the caller retry later
        return null;
      });
      data = validateProfile(raw, sourceText, candidates, github, pricingText);
    }
    if (!data) throw new Error('not enough verifiable content');

    await save({ status: 'ready', data, sources: pages.map(p => p.url), error: null, generated_at: new Date().toISOString() });
    return { status: 'ready' };
  } catch (e: any) {
    const error = String(e?.message ?? e).slice(0, 300);
    await save({ status: 'failed', error });
    return { status: 'failed', error };
  }
}

export async function claimToolProfile(productId: number): Promise<boolean> {
  const { data } = await serviceClient.rpc('claim_tool_profile' as never, { _product_id: productId } as never);
  return data === true;
}
