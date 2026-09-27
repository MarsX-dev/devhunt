import {
  EXTRACTION_PROMPT,
  hostOf,
  hitText,
  relevanceRequest,
  relevantHits,
  searchQueries,
  validateExtraction,
  type EnrichmentItem,
  type SearchHit,
} from '@/utils/enrichment';
import { jevAsk } from '@/utils/server/jev';

// Env (server-only): FIRECRAWL_KEY (search), JEV_KEY (relevance), GROQ_API_KEY (extraction).
const FIRECRAWL_KEY = () => process.env.FIRECRAWL_KEY || process.env.FIRECRAWL_API_KEY;
const GROQ_KEY = () => process.env.GROQ_API_KEY;
const GROQ_MODEL = () => process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export const enrichmentEnabled = () => !!(FIRECRAWL_KEY() && GROQ_KEY());

async function firecrawlSearch(query: string, limit: number, withContent: boolean): Promise<SearchHit[]> {
  const res = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      limit,
      ...(withContent ? { scrapeOptions: { formats: ['markdown'], onlyMainContent: true } } : {}),
    }),
    signal: AbortSignal.timeout(40000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.success) throw new Error(`firecrawl search ${res.status}: ${body?.error ?? 'failed'}`);
  return ((body.data ?? []) as any[])
    .filter(r => typeof r?.url === 'string')
    .map(r => ({ url: r.url, title: String(r.title ?? ''), description: String(r.description ?? ''), markdown: r.markdown ? String(r.markdown).slice(0, 12000) : undefined }));
}

async function groqJson(system: string, user: string): Promise<unknown | null> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL(),
      temperature: 0.1,
      reasoning_effort: 'low',
      max_completion_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(40000),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`groq ${res.status}: ${JSON.stringify(body)?.slice(0, 200)}`);
  const text = body?.choices?.[0]?.message?.content;
  return typeof text === 'string' ? JSON.parse(text) : null;
}

export interface EnrichmentRun {
  items: EnrichmentItem[];
  stats: { results: number; relevant: number; ms: number };
}

// Searches the web for a tool and returns verified awards, review quotes, mentions and highlights.
export async function enrichTool(tool: { name: string; demo_url: string | null }): Promise<EnrichmentRun> {
  const started = Date.now();
  const domain = hostOf(/^https?:\/\//i.test(tool.demo_url ?? '') ? tool.demo_url! : `https://${tool.demo_url}`);
  if (!domain) throw new Error('The tool has no valid website');
  const queries = searchQueries(tool.name, domain);

  const [general, launches, reviews] = await Promise.all([
    firecrawlSearch(queries.general, 8, false),
    firecrawlSearch(queries.launches, 6, true).catch(() => [] as SearchHit[]),
    firecrawlSearch(queries.reviews, 6, true).catch(() => [] as SearchHit[]),
  ]);
  const byUrl = new Map<string, SearchHit>();
  for (const hit of [...launches, ...reviews, ...general]) {
    if (!hostOf(hit.url).endsWith('devhunt.org') && !byUrl.has(hit.url)) byUrl.set(hit.url, hit);
  }
  const hits = Array.from(byUrl.values()).slice(0, 20);

  const { state, questions } = relevanceRequest(tool.name, domain, hits);
  const relevant = relevantHits(hits, hits.length ? await jevAsk(state, questions, 10000) : null, tool.name, domain);
  if (!relevant.length) return { items: [], stats: { results: hits.length, relevant: 0, ms: Date.now() - started } };

  const input = [
    `Tool: ${tool.name}`,
    `Website: ${domain}`,
    '',
    ...relevant.map((hit, i) => `### Result ${i + 1}\nURL: ${hit.url}\nTitle: ${hit.title}\nText: ${hitText(hit).slice(0, 2500)}`),
  ].join('\n');
  const raw = await groqJson(EXTRACTION_PROMPT, input);
  const items = validateExtraction(raw, relevant, domain);
  return { items, stats: { results: hits.length, relevant: relevant.length, ms: Date.now() - started } };
}
