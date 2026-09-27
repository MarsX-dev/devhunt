// Tool profiles: an AI-written, fact-checked summary of a tool built from its own website (features,
// use cases, pricing plans, FAQ) plus how it compares to similar DevHunt tools.
// Pure functions (tested); the network calls live in utils/server/toolProfile.ts.

export interface ProfileFeature {
  title: string;
  description: string;
}
export interface ProfilePlan {
  name: string;
  price: string;
  billing: string | null;
  highlights: string[];
}
export interface ProfileAlternative {
  id: number;
  difference: string;
  best_for: string | null;
}
export interface GithubStats {
  repo: string;
  stars: number;
  forks: number;
  license: string | null;
  language: string | null;
  pushed_at: string | null;
}
export interface ToolProfileData {
  summary: string;
  audience: string | null;
  best_for: string | null;
  features: ProfileFeature[];
  use_cases: string[];
  integrations: string[];
  pricing: { model: string | null; free_trial: boolean | null; plans: ProfilePlan[] } | null;
  faq: { q: string; a: string }[];
  alternatives: ProfileAlternative[];
  github: GithubStats | null;
}

export interface Candidate {
  id: number;
  name: string;
  slogan: string | null;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

// Markdown without images and link targets: the text is what matters, and it's far fewer tokens.
export function cleanMarkdown(markdown: string, max = 14000): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

// Up to two more pages worth reading on the tool's own site: pricing first, then features.
export function pickPages(links: string[], siteUrl: string): string[] {
  const host = hostOf(siteUrl);
  const own = Array.from(new Set(links.map(l => l.split('#')[0].replace(/\/$/, '')))).filter(l => {
    const h = hostOf(l);
    return h === host || h.endsWith(`.${host}`) || host.endsWith(`.${h}`);
  });
  const path = (l: string) => {
    try {
      return new URL(l).pathname.toLowerCase();
    } catch {
      return '';
    }
  };
  const pricing = own.find(l => /^\/(pricing|plans|price|prices)$/.test(path(l))) ?? own.find(l => /pric/.test(path(l)));
  const features = own.find(l => /^\/(features|product|platform|why[-\w]*)$/.test(path(l)));
  return [pricing, features].filter((l): l is string => !!l);
}

// owner/repo from a GitHub URL (the tool's github_url or a link on its site).
export function githubRepo(urls: (string | null | undefined)[]): string | null {
  for (const url of urls) {
    const m = (url ?? '').match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i);
    if (m && !['orgs', 'sponsors', 'features', 'topics', 'marketplace', 'apps', 'about', 'pricing', 'login'].includes(m[1].toLowerCase())) {
      return `${m[1]}/${m[2]}`;
    }
  }
  return null;
}

export const PROFILE_PROMPT = `You write the fact sheet for a developer tool's page on DevHunt, a launchpad for dev tools. You get the tool's name, its launch text, text from its own website (home page, and pricing/features pages when available) and a list of other DevHunt tools that might be similar.
Return ONLY a JSON object:
{
  "summary": "one plain sentence on what the tool is and does (max 160 chars)",
  "audience": "who it is for (max 120 chars)",
  "best_for": "short phrase for a comparison table, e.g. 'Secure sandboxes for AI agents' (max 60 chars)",
  "features": [{"title": "feature name (max 50 chars)", "description": "what it does, one sentence (max 150 chars)"}],
  "use_cases": ["concrete use case (max 110 chars)"],
  "integrations": ["named language, framework, platform or product it integrates with"],
  "pricing": {"model": "free | freemium | paid | open source | contact sales", "free_trial": true/false/null, "plans": [{"name": "plan name", "price": "price exactly as written, e.g. '$20'", "billing": "e.g. 'per month' or null", "highlights": ["up to 4 short plan highlights"]}]},
  "faq": [{"q": "a question a developer would ask", "a": "answer in 1-3 sentences"}],
  "alternatives": [{"id": 123, "difference": "how that tool differs from this one (max 150 chars)", "best_for": "short phrase for that tool (max 60 chars)"}]
}
Rules:
- Use only facts stated in the given text. Never guess prices, numbers, customers or integrations. Omit what the text doesn't say (null or empty array).
- 4 to 8 features, 3 to 5 use cases, 4 to 6 FAQ entries, answered only from the given text.
- Pricing plans only when the pricing text shows them; copy prices exactly.
- alternatives: pick up to 4 tools from the given list that solve a similar problem (use their ids). Skip ones that aren't really comparable. Empty is fine.
- Neutral, factual tone. No marketing superlatives ("revolutionary", "best-in-class"). English.`;

export function profileInput(
  tool: { name: string; slogan: string | null; description: string | null },
  pages: { url: string; text: string }[],
  candidates: Candidate[],
): string {
  const launch = (tool.description ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
  return [
    `Tool: ${tool.name}`,
    `Tagline: ${tool.slogan ?? ''}`,
    `Launch text: ${launch}`,
    '',
    ...pages.map(p => `### Page: ${p.url}\n${p.text}`),
    '',
    '### Similar DevHunt tools (id | name | tagline)',
    ...candidates.map(c => `${c.id} | ${c.name.trim()} | ${(c.slogan ?? '').trim()}`),
  ].join('\n');
}

const norm = (text: string) => text.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
const str = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() ? v.trim().replace(/[\u2010\u2011\u2012]/g, '-').replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').slice(0, max) : null;
const list = (v: unknown) => (Array.isArray(v) ? v : []);
const HYPE = /\b(revolutionary|best-in-class|world-class|game[- ]chang\w*|cutting-edge|unparalleled|seamless(ly)?)\b/i;

// Checks the LLM output against the source text: integrations must be named in it, plan prices
// must appear on the pricing page, alternatives must be one of the candidates. Everything is length
// capped; anything that fails is dropped.
// pricingText: text of the tool's pricing page, when one was read; paid plans need it.
export function validateProfile(
  raw: unknown,
  sourceText: string,
  candidates: Candidate[],
  github: GithubStats | null,
  pricingText = '',
): ToolProfileData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, any>;
  const source = norm(sourceText);
  const summary = str(r.summary, 200);
  if (!summary) return null;

  const features = list(r.features)
    .map(f => ({ title: str(f?.title, 60), description: str(f?.description, 180) }))
    .filter((f): f is ProfileFeature => !!f.title && !!f.description && !HYPE.test(f.description))
    .slice(0, 8);

  const use_cases = list(r.use_cases)
    .map(u => str(u, 130))
    .filter((u): u is string => !!u && u.length >= 10)
    .slice(0, 5);

  const integrations = Array.from(new Set(list(r.integrations).map(i => str(i, 40)).filter((i): i is string => !!i && source.includes(norm(i))))).slice(0, 14);

  const plans = list(r.pricing?.plans)
    .map(p => ({
      name: str(p?.name, 40),
      price: str(p?.price, 30),
      billing: str(p?.billing, 30),
      highlights: list(p?.highlights).map(h => str(h, 90)).filter((h): h is string => !!h).slice(0, 4),
    }))
    .filter((p): p is ProfilePlan => {
      if (!p.name || !p.price) return false;
      if (/^(free|[$€£]?\s?0)$/i.test(p.price)) return true;
      // Paid plans: the price, as written, has to be on the pricing page.
      return /\d/.test(p.price) && norm(pricingText).replace(/\s/g, '').includes(norm(p.price).replace(/\s/g, ''));
    })
    .slice(0, 5);
  const model = str(r.pricing?.model, 30);
  const pricing = model || plans.length ? { model, free_trial: typeof r.pricing?.free_trial === 'boolean' ? r.pricing.free_trial : null, plans } : null;

  const faq = list(r.faq)
    .map(f => ({ q: str(f?.q, 140), a: str(f?.a, 420) }))
    .filter((f): f is { q: string; a: string } => !!f.q && !!f.a && f.a.length >= 20)
    .slice(0, 6);

  const ids = new Set(candidates.map(c => c.id));
  const seen = new Set<number>();
  const alternatives = list(r.alternatives)
    .map(a => ({ id: Number(a?.id), difference: str(a?.difference, 170), best_for: str(a?.best_for, 70) }))
    .filter((a): a is ProfileAlternative => {
      if (!ids.has(a.id) || !a.difference || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    })
    .slice(0, 4);

  if (features.length < 2 && faq.length < 2) return null; // too little to be worth showing
  return {
    summary,
    audience: str(r.audience, 140),
    best_for: str(r.best_for, 70),
    features,
    use_cases,
    integrations,
    pricing,
    faq,
    alternatives,
    github,
  };
}
