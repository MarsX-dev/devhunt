// Rich launch pages: turning web search results into awards, review quotes, mentions and highlights.
// Pure functions (tested); the network calls live in utils/server/enrich.ts.

export type EnrichmentKind = 'award' | 'review' | 'mention' | 'highlight';

export interface SearchHit {
  url: string;
  title: string;
  description: string;
  markdown?: string;
}

export interface EnrichmentItem {
  kind: EnrichmentKind;
  title: string; // award name, review quote, mention headline or highlight text
  body?: string | null; // review author / award detail
  url?: string | null;
  source?: string | null; // "Product Hunt", "Reddit", ...
  meta?: Record<string, unknown>;
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

const SOURCES: Record<string, string> = {
  'producthunt.com': 'Product Hunt',
  'news.ycombinator.com': 'Hacker News',
  'reddit.com': 'Reddit',
  'github.com': 'GitHub',
  'x.com': 'X',
  'twitter.com': 'X',
  'youtube.com': 'YouTube',
  'linkedin.com': 'LinkedIn',
  'g2.com': 'G2',
  'capterra.com': 'Capterra',
  'trustpilot.com': 'Trustpilot',
  'peerlist.io': 'Peerlist',
  'uneed.best': 'Uneed',
  'microlaunch.net': 'Microlaunch',
  'betalist.com': 'BetaList',
  'saashub.com': 'SaaSHub',
  'alternativeto.net': 'AlternativeTo',
  'dev.to': 'DEV',
  'medium.com': 'Medium',
  'indiehackers.com': 'Indie Hackers',
  'fazier.com': 'Fazier',
  'hackernoon.com': 'HackerNoon',
  'techcrunch.com': 'TechCrunch',
};

export function sourceName(url: string, ownDomain?: string): string {
  const host = hostOf(url);
  if (ownDomain && (host === ownDomain || host.endsWith(`.${ownDomain}`))) return 'Official site';
  const known = Object.keys(SOURCES).find(domain => host === domain || host.endsWith(`.${domain}`));
  return known ? SOURCES[known] : host;
}

// Three searches: general, launches/awards, reviews.
export function searchQueries(name: string, domain: string) {
  const n = `"${name.trim()}"`;
  return {
    general: `${n} ${domain}`,
    launches: `${n} ${domain} "product of the day" OR "product hunt" OR launch OR winner`,
    reviews: `${n} ${domain} review OR reviews OR testimonials OR "what users say"`,
  };
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[*_`#>[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const hitText = (hit: SearchHit) => `${hit.title}\n${hit.description}\n${hit.markdown ?? ''}`;

// JEV question per result: is it about this tool (not a namesake)?
export function relevanceRequest(name: string, domain: string, hits: SearchHit[]) {
  const state = hits
    .map((hit, i) => `#${i} ${hit.title}\nURL: ${hit.url}\n${hit.description.slice(0, 300)}`)
    .join('\n\n');
  const questions: Record<string, unknown> = {};
  hits.forEach((_, i) => {
    questions[`r${i}`] = {
      type: 'noul',
      instructions: `Is result #${i} about the software product "${name}" whose website is ${domain} (not a person, place or different product with a similar name)?`,
    };
  });
  return { state: `Search results for the software product "${name}" (${domain}):\n\n${state}`, questions };
}

export function relevantHits(hits: SearchHit[], answers: Record<string, any> | null, name: string, domain: string, threshold = 0.55) {
  return hits.filter((hit, i) => {
    if (hostOf(hit.url).endsWith(domain)) return true; // the tool's own site
    const p = Number(answers?.[`r${i}`]?.noul);
    if (Number.isFinite(p)) return p >= threshold;
    // Without JEV: the name has to appear in the result.
    return normalize(hitText(hit)).includes(normalize(name));
  });
}

// Checks the LLM output against the search results: links must be one of the results, review quotes
// must appear word for word in that result, and award evidence must be in the text. Anything else
// is dropped, so the owner only ever sees things that are actually on the web.
export function validateExtraction(raw: unknown, hits: SearchHit[], ownDomain: string): EnrichmentItem[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, any>;
  const byUrl = new Map(hits.map(hit => [hit.url.replace(/\/$/, ''), hit]));
  const hitFor = (url: unknown) => (typeof url === 'string' ? byUrl.get(url.replace(/\/$/, '')) : undefined);
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ').slice(0, max) : null);
  const items: EnrichmentItem[] = [];

  for (const a of Array.isArray(r.awards) ? r.awards : []) {
    const hit = hitFor(a?.url);
    const title = str(a?.title, 80);
    const evidence = str(a?.evidence, 300);
    if (!hit || !title || !evidence || !normalize(hitText(hit)).includes(normalize(evidence))) continue;
    items.push({ kind: 'award', title, body: str(a?.detail, 140), url: hit.url, source: str(a?.platform, 40) ?? sourceName(hit.url, ownDomain) });
  }
  for (const rv of Array.isArray(r.reviews) ? r.reviews : []) {
    const hit = hitFor(rv?.url);
    const quote = str(rv?.quote, 280);
    if (!hit || !quote || quote.length < 25 || !normalize(hitText(hit)).includes(normalize(quote))) continue;
    items.push({ kind: 'review', title: quote, body: str(rv?.author, 80), url: hit.url, source: sourceName(hit.url, ownDomain) });
  }
  for (const m of Array.isArray(r.mentions) ? r.mentions : []) {
    const hit = hitFor(m?.url);
    if (!hit || hostOf(hit.url).endsWith(ownDomain) || hostOf(hit.url).endsWith('devhunt.org')) continue;
    items.push({ kind: 'mention', title: str(m?.title, 140) ?? hit.title.slice(0, 140), url: hit.url, source: sourceName(hit.url, ownDomain), meta: { type: str(m?.type, 20) } });
  }
  for (const h of Array.isArray(r.highlights) ? r.highlights.slice(0, 6) : []) {
    const text = str(h, 90);
    if (text && text.length >= 12) items.push({ kind: 'highlight', title: text, source: 'Official site' });
  }

  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.kind}:${item.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const EXTRACTION_PROMPT = `You find public proof for a developer tool's launch page. You get the tool name, its website and web search results (title, URL, text).
Return ONLY a JSON object:
{
  "awards": [{"title": "e.g. #1 Product of the Day", "platform": "e.g. Product Hunt", "detail": "optional, e.g. date or category", "url": "result URL", "evidence": "exact words from that result that state the award"}],
  "reviews": [{"quote": "an exact sentence copied from the result where a user praises or reviews the tool", "author": "name or handle if shown, else null", "url": "result URL"}],
  "mentions": [{"title": "short headline of the article/video/discussion", "type": "article|video|discussion|directory|social|repo", "url": "result URL"}],
  "highlights": ["3 to 6 short feature highlights (max 90 chars) based on the tool's own site"]
}
Rules: use only facts that appear in the given results; copy quotes and evidence word for word; every url must be one of the given result URLs; only include items about this exact tool (ignore namesakes); skip anything you are not sure about. Empty arrays are fine.`;
