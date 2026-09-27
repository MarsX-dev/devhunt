import { jevAsk } from '@/utils/server/jev';
import { safeFetch } from '@/utils/server/safeFetch';
import { directVerdict, goneReason, hijackQuestions, hijackVerdict, htmlToSnapshot, mentionsTool, siteVariants, type PageSnapshot, type SiteStatus } from '@/utils/siteHealth';

const FIRECRAWL_KEY = () => process.env.FIRECRAWL_KEY || process.env.FIRECRAWL_API_KEY;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const addHttps = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

async function fetchDirect(url: string): Promise<PageSnapshot> {
  try {
    // Tool websites are set by their owners: public hosts only (redirects re-checked).
    const res = await safeFetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(15000) });
    const html = (res.headers.get('content-type') ?? '').includes('html') ? (await res.text()).slice(0, 400000) : '';
    return htmlToSnapshot(html, res.status, res.url);
  } catch (e: any) {
    const code = e?.cause?.code ?? e?.code ?? e?.name ?? 'error';
    return { status: null, error: `${code}${e?.cause?.message ? `: ${e.cause.message}` : ''}`, finalUrl: null, title: '', text: '' };
  }
}

// A second opinion from Firecrawl (renders JavaScript, different network).
async function fetchFirecrawl(url: string): Promise<PageSnapshot | null> {
  if (!FIRECRAWL_KEY()) return null;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: false, timeout: 30000 }),
      signal: AbortSignal.timeout(40000),
    });
    const body = await res.json().catch(() => ({}));
    if (!body?.success) {
      const err = String(body?.error ?? `firecrawl ${res.status}`);
      // Firecrawl's own trouble (rate limit, credits, timeouts) is not evidence about the site.
      if (res.status === 429 || res.status === 402 || /timed out|timeout/i.test(err)) return null;
      return { status: null, error: err.slice(0, 160), finalUrl: null, title: '', text: '' };
    }
    const meta = body.data?.metadata ?? {};
    const first = (v: unknown) => String((Array.isArray(v) ? v[0] : v) ?? '');
    const text = String(body.data?.markdown ?? '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ');
    return { status: Number(meta.statusCode) || 200, error: null, finalUrl: first(meta.url) || first(meta.sourceURL) || url, title: first(meta.title), text };
  } catch {
    return null;
  }
}

export interface SiteCheck {
  status: SiteStatus;
  reason: string | null;
  inconclusive?: boolean;
}

// dead = both the direct request and Firecrawl find it gone; hijacked = JEV is confident the page is
// no longer the tool, on the Firecrawl-rendered page too. Anything unclear counts as ok.
export async function checkSite(tool: { name: string; slogan: string | null; demo_url: string | null }): Promise<SiteCheck> {
  if (!tool.demo_url?.trim()) return { status: 'ok', reason: null, inconclusive: true };
  let url = addHttps(tool.demo_url.trim());
  let direct = await fetchDirect(url);
  let verdict = directVerdict(direct);
  // A "404" that still shows the tool (single-page apps do this) is a live site.
  if (verdict && verdict !== 'suspicious' && direct.text.length > 500 && mentionsTool(direct, tool.name, url)) verdict = null;
  // Before calling it dead, try the site's other addresses (home page, www/bare host, parent domain):
  // a broken deep link or a misconfigured redirect isn't a dead tool.
  if (verdict && verdict !== 'suspicious') {
    for (const alt of siteVariants(url)) {
      const page = await fetchDirect(alt);
      if (!directVerdict(page) && page.status && page.status < 400) {
        [url, direct, verdict] = [alt, page, null];
        break;
      }
    }
  }

  if (verdict && verdict !== 'suspicious') {
    const second = await fetchFirecrawl(url);
    if (!second) return { status: 'ok', reason: null, inconclusive: true };
    const secondVerdict = directVerdict(second);
    if (secondVerdict && secondVerdict !== 'suspicious') return { status: 'dead', reason: verdict.dead };
    if (second.status && second.status < 400 && !goneReason(second)) return checkContent(tool, url, second);
    return { status: 'ok', reason: null, inconclusive: true };
  }

  // Blocked or odd response: judge the Firecrawl copy instead.
  let page: PageSnapshot | null = direct;
  if (verdict === 'suspicious' || !direct.status || direct.status >= 400 || direct.text.length < 200) page = await fetchFirecrawl(url);
  if (!page || page.error || (page.status ?? 0) >= 400) return { status: 'ok', reason: null, inconclusive: true };
  const gone = goneReason(page);
  if (gone) return { status: 'dead', reason: gone };
  return checkContent(tool, url, page);
}

async function checkContent(tool: { name: string; slogan: string | null }, url: string, page: PageSnapshot): Promise<SiteCheck> {
  if (mentionsTool(page, tool.name, url)) return { status: 'ok', reason: null };
  const ask = async (p: PageSnapshot) => {
    const { state, questions } = hijackQuestions({ ...tool, website: url }, p);
    return hijackVerdict(await jevAsk(state, questions, 15000));
  };
  const first = await ask(page);
  if (!first) return { status: 'ok', reason: null };
  // Confirm on the rendered page before hiding anything.
  const rendered = page.text.length > 200 && page.finalUrl && page !== null ? await fetchFirecrawl(url) : null;
  if (rendered && !rendered.error && !mentionsTool(rendered, tool.name, url)) {
    const second = await ask(rendered);
    if (second) return { status: 'hijacked', reason: `${second}${rendered.title ? ` ("${rendered.title.slice(0, 60)}")` : ''}` };
  }
  return { status: 'ok', reason: null, inconclusive: true };
}

// Checks one tool and saves the result (service role). Returns the change to report, if any.
export async function checkAndSave(
  client: any,
  tool: { id: number; name: string; slug: string; slogan: string | null; demo_url: string | null; site_status: string },
): Promise<import('@/utils/server/discord').SiteHealthChange | null> {
  const result = await checkSite(tool);
  // An inconclusive check never changes a status (neither hides nor restores).
  const status = result.inconclusive ? tool.site_status : result.status;
  await client
    .from('products')
    .update({ site_status: status, site_status_reason: status === 'ok' ? null : result.reason ?? undefined, site_checked_at: new Date().toISOString() })
    .eq('id', tool.id);
  if (status === tool.site_status) return null;
  return { id: tool.id, name: tool.name, slug: tool.slug, website: tool.demo_url ?? '', from: tool.site_status, to: status as any, reason: result.reason };
}
