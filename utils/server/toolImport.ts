import { jevRequest, parseJevAnswers, type CategoryOption, type ScrapedPage } from '@/utils/toolImport';
import categoryList from '@/utils/categories';
import { jevAsk, jevEnabled } from '@/utils/server/jev';

// Env vars (server-only):
//   FIRECRAWL_KEY  enables "start with your website URL" on the submit form (Firecrawl scrapes the page)
//   JEV_KEY        optional: TypeSafe JEV classifies pricing and categories (else keyword matching)
//   JEV_API_URL    optional override of the JEV endpoint
const FIRECRAWL_KEY = () => process.env.FIRECRAWL_KEY || process.env.FIRECRAWL_API_KEY;
export const importEnabled = () => !!FIRECRAWL_KEY();
export const aiEnabled = jevEnabled;

export async function scrapeWithFirecrawl(url: string): Promise<ScrapedPage> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, timeout: 20000 }),
    signal: AbortSignal.timeout(25000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.success) throw new Error(`firecrawl ${res.status}: ${body?.error ?? 'scrape failed'}`);
  const meta = body.data?.metadata ?? {};
  const first = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined;
  return {
    url: first(meta.sourceURL) || url,
    title: first(meta.title) || first(meta.ogTitle),
    description: first(meta.description) || first(meta.ogDescription),
    siteName: first(meta.ogSiteName),
    ogImage: first(meta.ogImage),
    favicon: first(meta.favicon),
    markdown: body.data?.markdown ?? '',
  };
}

// Classifies pricing and categories with JEV. Returns null when JEV is not configured or fails;
// the caller then keeps the keyword-based draft.
export async function classifyWithJev(page: ScrapedPage, categories: CategoryOption[]): Promise<unknown | null> {
  const described = categories.map(c => ({ ...c, description: categoryList.find(k => k.name === c.name)?.description }));
  const { state, questions } = jevRequest(page, described);
  const answers = await jevAsk(state, questions);
  return answers ? parseJevAnswers({ answers }, categories) : null;
}

const UPLOAD_URL = 'https://d1gl9g4ciwvjfq.cloudfront.net/api/UploadFile'; // same host as the form's uploads
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Copies an image from the tool's website to DevHunt's image host (imgix), so the listing doesn't
// hotlink files the site may change or remove. Falls back to the original URL.
export async function rehostImage(url: string, imgixOptions: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'follow' });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.startsWith('image/')) throw new Error(`not an image (${res.status} ${type})`);
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) throw new Error(`size ${bytes.byteLength}`);
    const ext = (type.split('/')[1] ?? 'png').split(/[+;]/)[0].replace('jpeg', 'jpg');
    const form = new FormData();
    form.append('image', new Blob([bytes], { type }), `${Date.now()}-import.${ext}`);
    const upload = await fetch(UPLOAD_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(15000) });
    const data = await upload.json();
    const hosted = data?.file?.url as string | undefined;
    if (!upload.ok || !hosted) throw new Error(`upload ${upload.status}`);
    return `${hosted.replace('https://marscode.s3.eu-north-1.amazonaws.com/assets/img', 'https://mars-images.imgix.net')}?auto=compress&fit=max&${imgixOptions}`;
  } catch (err) {
    console.error('image rehost failed:', url.slice(0, 120), (err as Error).message);
    return url;
  }
}
