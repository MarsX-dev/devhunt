// Turns a scraped web page into a draft tool submission. Pure functions, so they can be tested
// without calling Firecrawl or JEV.

export interface ScrapedPage {
  url: string;
  title?: string;
  description?: string;
  siteName?: string;
  ogImage?: string;
  favicon?: string;
  markdown?: string;
}

export interface CategoryOption {
  id: number;
  name: string;
}

export interface ToolDraft {
  name: string;
  slogan: string;
  description: string;
  website: string;
  pricingTypeId: number | null; // 1 Free, 2 Subscription, 3 One time fee
  categoryIds: number[];
  logoUrl: string | null;
  screenshotUrls: string[];
}

export const PRICING = { free: 1, subscription: 2, oneTime: 3 } as const;

const clip = (text: string, max: number) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : max).replace(/[,.;:\s-]+$/, '')}…`;
};

// "Acme – Ship faster | Acme Inc" -> name "Acme", rest "Ship faster"
export function splitTitle(title = ''): { name: string; rest: string } {
  const parts = title
    .split(/\s[|\-–—:·•]\s|\s[|–—·•]|[|–—·•:]\s/)
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return { name: '', rest: '' };
  // The brand is usually the shortest part (often first or last).
  const name = [...parts].sort((a, b) => a.length - b.length)[0];
  const rest = parts.filter(p => p !== name).sort((a, b) => b.length - a.length)[0] ?? '';
  return { name, rest };
}

// Cookie banners, consent and legal text that often sits at the top of scraped pages.
const JUNK_PARAGRAPH =
  /cookie|consent|privacy policy|terms of (service|use)|all rights reserved|browser identifier|third[- ]party|tracking technolog|your preferences|we use (cookies|tracking)|javascript is (disabled|required)/i;

// First sentence when it fits (no "…" mid-sentence), otherwise a clipped version.
export function tagline(text = '', max = 100): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const first = clean.match(/^.{10,}?[.!?](?=\s|$)/)?.[0];
  if (clean.length <= max) return clean;
  if (first && first.length <= max) return first;
  return clip(clean, max);
}

// Favicons of 16/32px look blurry as a logo; Google's favicon service returns the largest one.
const isTinyIcon = (url: string) => /(^|[^0-9])(16|32)x(16|32)([^0-9]|$)|favicon\.ico($|\?)/i.test(url);

// Plain text of the first real paragraphs of a page's markdown.
export function markdownIntro(markdown = '', max = 800): string {
  const paragraphs = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/<[^>]+>/g, ' ')
    .split(/\n\s*\n/)
    .map(p => p.replace(/^#+\s*/gm, '').replace(/[*_`>]/g, '').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 60 && !JUNK_PARAGRAPH.test(p));
  let out = '';
  for (const p of paragraphs) {
    if (out.length + p.length > max) break;
    out += (out ? '\n\n' : '') + p;
  }
  return out || clip(paragraphs[0] ?? '', max);
}

export function guessPricing(text: string): number | null {
  const t = text.toLowerCase();
  if (/one[- ]time (payment|purchase|fee)|lifetime (deal|access|license)|pay once/.test(t)) return PRICING.oneTime;
  if (/\/\s?mo(nth)?\b|per month|\/\s?yr\b|per year|monthly|annually|subscription|billed/.test(t)) return PRICING.subscription;
  if (/open[- ]source|free forever|100% free|completely free|\bfree\b/.test(t)) return PRICING.free;
  return null;
}

// Extra keywords per category (the category name itself always counts).
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ai: ['llm', 'gpt', 'openai', 'claude', 'machine learning', 'ai agent', 'agents', 'artificial intelligence', 'prompt'],
  'open source': ['open-source', 'github.com', 'mit license', 'apache 2.0', 'self-hosted', 'self hosted'],
  devops: ['deploy', 'deployment', 'kubernetes', 'docker', 'infrastructure', 'terraform'],
  ci: ['ci/cd', 'continuous integration', 'build pipeline'],
  code: ['coding', 'source code', 'refactor', 'code review', 'developers'],
  nocode: ['no-code', 'no code', 'low-code', 'without coding'],
  analytics: ['metrics', 'dashboards', 'tracking', 'insights'],
  qa: ['testing', 'test automation', 'end-to-end tests', 'e2e', 'bug'],
  api: ['rest api', 'graphql', 'sdk', 'endpoint', 'webhook'],
  db: ['database', 'postgres', 'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis'],
  design: ['figma', 'ui/ux', 'mockup', 'designers'],
  hosting: ['serverless', 'cdn', 'vps', 'host your'],
  'ui library': ['component library', 'ui kit', 'ui components', 'react components'],
  marketing: ['seo', 'social media', 'growth', 'marketers', 'campaign'],
  emails: ['email', 'smtp', 'inbox', 'newsletter'],
  framework: ['framework'],
  language: ['programming language', 'compiler'],
  crypto: ['bitcoin', 'blockchain', 'token', 'wallet'],
  web3: ['ethereum', 'solana', 'dapp', 'smart contract', 'onchain', 'on-chain'],
  charts: ['chart', 'visualization', 'graphs'],
  ide: ['vscode', 'vs code', 'jetbrains', 'editor extension'],
  monitoring: ['uptime', 'observability', 'logs', 'alerting', 'incident'],
  'workflow automation': ['automation', 'automate', 'workflow', 'zapier', 'n8n'],
  cms: ['content management', 'headless cms'],
  security: ['vulnerability', 'authentication', 'encryption', 'secrets', 'compliance'],
  'tailwind css': ['tailwind'],
  boilerplate: ['starter kit', 'saas starter', 'template', 'starter template'],
  helpers: ['utility', 'productivity'],
};

const countMatches = (text: string, phrase: string) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  return (text.match(new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'g')) ?? []).length;
};

export function guessCategories(text: string, options: CategoryOption[], max = 3): number[] {
  const t = text.toLowerCase();
  return options
    .map(option => {
      const key = option.name.toLowerCase();
      const phrases = [key, ...(CATEGORY_KEYWORDS[key] ?? [])];
      return { id: option.id, score: phrases.reduce((sum, p) => sum + countMatches(t, p), 0) };
    })
    .filter(c => c.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(c => c.id);
}

const absolute = (maybeUrl: string | undefined, base: string) => {
  if (!maybeUrl) return null;
  try {
    const url = new URL(maybeUrl, base);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

// Draft without any AI: page metadata + keyword matching.
export function draftFromPage(page: ScrapedPage, categories: CategoryOption[]): ToolDraft {
  const { name: titleName, rest: titleRest } = splitTitle(page.title);
  const host = new URL(page.url).hostname.replace(/^www\./, '');
  const name = clip(splitTitle(page.siteName).name || titleName || host.split('.')[0], 40);
  const slogan = tagline(page.description || titleRest || '');
  const intro = markdownIntro(page.markdown, 700);
  const description = [page.description, intro].filter(Boolean).join('\n\n') || '';
  const favicon = absolute(page.favicon, page.url);
  const text = [page.title, page.description, page.markdown?.slice(0, 6000)].filter(Boolean).join('\n');
  return {
    name,
    slogan,
    description,
    website: page.url,
    pricingTypeId: guessPricing(text),
    categoryIds: guessCategories(text, categories),
    logoUrl: favicon && !isTinyIcon(favicon) ? favicon : `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
    screenshotUrls: [absolute(page.ogImage, page.url)].filter((u): u is string => !!u),
  };
}

// Merges an AI classification (JEV) over the keyword draft; anything missing or invalid keeps the draft value.
export function mergeClassification(draft: ToolDraft, ai: unknown, categories: CategoryOption[]): ToolDraft {
  if (!ai || typeof ai !== 'object') return draft;
  const a = ai as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? clip(v, max) : null);
  const byName = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
  const aiCategories = Array.isArray(a.categories)
    ? a.categories.map(c => byName.get(String(c).toLowerCase())).filter((id): id is number => !!id).slice(0, 3)
    : [];
  const pricing = typeof a.pricing === 'string' ? a.pricing.toLowerCase() : '';
  const pricingTypeId = pricing.includes('one') ? PRICING.oneTime : pricing.includes('sub') ? PRICING.subscription : pricing.includes('free') ? PRICING.free : null;
  return {
    ...draft,
    name: str(a.name, 40) ?? draft.name,
    slogan: typeof a.slogan === 'string' && a.slogan.trim() ? tagline(a.slogan) : draft.slogan,
    description: str(a.description, 1200) ?? draft.description,
    pricingTypeId: pricingTypeId ?? draft.pricingTypeId,
    categoryIds: aiCategories.length ? aiCategories : draft.categoryIds,
  };
}

// --- JEV (TypeSafe System One: https://docs.typesafe.ai/api) -------------------------------------
// JEV answers typed questions (choice / score / yes-no "noul") about a piece of state. We ask one
// choice question for pricing and one yes/no question per category.

export const PRICING_OPTIONS = {
  Free: 'Free to use or open source; no paid plan is required',
  Subscription: 'Paid monthly or yearly plans (a free tier may exist)',
  'One time fee': 'A single one-time payment or lifetime license',
} as const;

const categoryKey = (id: number) => `category_${id}`;

export function jevRequest(page: ScrapedPage, categories: (CategoryOption & { description?: string })[]) {
  const state = [`URL: ${page.url}`, `Title: ${page.title ?? ''}`, `Description: ${page.description ?? ''}`, (page.markdown ?? '').slice(0, 4000)].join('\n');
  const questions: Record<string, unknown> = {
    pricing: { type: 'choice', instructions: 'How is this developer tool priced?', criteria: PRICING_OPTIONS },
  };
  for (const c of categories) {
    questions[categoryKey(c.id)] = {
      type: 'noul',
      instructions: `Is this developer tool clearly in the "${c.name}" category${c.description ? ` (${c.description})` : ''}?`,
      criteria: { true: `A core part of what the tool is or does is ${c.name}`, false: `${c.name} is not central to the tool` },
    };
  }
  return { model: 'jev-latest', state, questions };
}

// Converts JEV answers into the { pricing, categories } shape mergeClassification understands.
export function parseJevAnswers(body: unknown, categories: CategoryOption[], threshold = 0.5, max = 3): { pricing?: string; categories: string[] } {
  const answers = ((body as { answers?: Record<string, any> })?.answers ?? {}) as Record<string, any>;
  const pricing = answers.pricing?.type === 'choice' && answers.pricing.choice in PRICING_OPTIONS ? (answers.pricing.choice as string) : undefined;
  const picked = categories
    .map(c => ({ name: c.name, p: Number(answers[categoryKey(c.id)]?.noul) }))
    .filter(c => Number.isFinite(c.p) && c.p >= threshold)
    .sort((a, b) => b.p - a.p)
    .slice(0, max)
    .map(c => c.name);
  return { pricing, categories: picked };
}
