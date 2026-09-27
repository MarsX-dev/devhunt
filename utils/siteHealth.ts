// Website health (pure, tested): is a tool's website still there, and is it still the tool?
// The network part (fetch, Firecrawl, JEV) is utils/server/siteHealth.ts.

export type SiteStatus = 'ok' | 'dead' | 'hijacked';
export interface PageSnapshot {
  status: number | null; // HTTP status, null when the request failed
  error: string | null; // network error (DNS, refused, TLS, timeout)
  finalUrl: string | null;
  title: string;
  text: string; // visible text
}

// Pages that say the site is gone: parked or for-sale domains, expired hosting, default server pages.
const GONE = [
  /this domain (name )?(is|may be) for sale|buy this domain|domain (is )?for sale|make an offer on this domain/i,
  /this domain (has )?expired|domain has expired|renew (this|your) domain|domain is parked|parked (free,? )?(courtesy|by)/i,
  /\b(sedo|dan\.com|afternic|hugedomains|bodis|parkingcrew|above\.com|undeveloped\.com)\b.*\b(domain|parking)/i,
  /account (has been )?suspended|this account has been suspended|site (is )?(temporarily )?suspended/i,
  /there isn'?t a github pages site here|site not found\s*[·|-]\s*github pages/i,
  /deployment[_ ]not[_ ]found|the deployment could not be found on vercel/i,
  /no such app\b.*heroku|heroku \| application error|herokucdn\.com\/error-pages/i,
  /netlify.*page not found|looks like you'?ve followed a broken link or entered a url that doesn'?t exist on this site/i,
  /^\s*(welcome to nginx!?|it works!|index of \/|apache2 (ubuntu|debian) default page)/i,
  /project (is )?(not found|paused)\b.*(supabase|railway|render|fly\.io)|this (app|site|project) (has been|was) (deleted|removed)/i,
];

export function goneReason(page: PageSnapshot): string | null {
  const text = `${page.title}\n${page.text.slice(0, 4000)}`;
  const hit = GONE.find(re => re.test(text));
  return hit ? `the site says: "${(text.match(hit)?.[0] ?? '').trim().slice(0, 80)}"` : null;
}

const DEAD_ERRORS = /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|CERT_|certificate|SSL|TLS|ERR_TLS|UND_ERR_CONNECT|EHOSTUNREACH|ENETUNREACH/i;

// Direct request result -> dead reason, 'suspicious' (look closer), or null (fine / can't tell).
// Bot walls (401/403/429/503 from Cloudflare and co.) are "can't tell", never dead.
export function directVerdict(page: PageSnapshot): { dead: string } | 'suspicious' | null {
  if (page.error) return DEAD_ERRORS.test(page.error) ? { dead: page.error.includes('ENOTFOUND') ? 'domain does not resolve' : `connection failed (${page.error.slice(0, 60)})` } : 'suspicious';
  if (page.status === 404 || page.status === 410) return { dead: `HTTP ${page.status}` };
  if (page.status && page.status >= 500 && page.status !== 503) return { dead: `HTTP ${page.status}` };
  const gone = goneReason(page);
  if (gone) return { dead: gone };
  return null;
}

const words = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

// Cheap check before asking JEV: the tool's name (or its domain's brand) appears on the page.
export function mentionsTool(page: PageSnapshot, name: string, website: string): boolean {
  const text = ` ${words(`${page.title} ${page.text.slice(0, 20000)}`)} `;
  const clean = words(name.replace(/^[^\p{L}\p{N}]+/u, ''));
  const brand = (() => {
    try {
      return words(new URL(/^https?:/i.test(website) ? website : `https://${website}`).hostname.replace(/^www\./, '').split('.')[0]);
    } catch {
      return '';
    }
  })();
  const candidates = [clean, clean.replace(/ /g, ''), clean.split(' ')[0], brand].filter(c => c.length >= 3);
  return candidates.some(c => text.includes(` ${c} `) || (c.length >= 5 && text.replace(/ /g, '').includes(c.replace(/ /g, ''))));
}

export function hijackQuestions(tool: { name: string; slogan: string | null; website: string }, page: PageSnapshot) {
  const state = [
    `A developer tool was listed with this information:`,
    `Name: ${tool.name}`,
    `Tagline: ${tool.slogan ?? ''}`,
    `Website: ${tool.website}`,
    '',
    `This is what the website shows today${page.finalUrl ? ` (final URL ${page.finalUrl})` : ''}:`,
    `Title: ${page.title}`,
    page.text.slice(0, 3500),
  ].join('\n');
  return {
    state,
    questions: {
      same: {
        type: 'noul',
        instructions: 'Is the website today still the site of the listed tool (the same product, possibly rebranded or redesigned)?',
        criteria: {
          true: 'The page is about the listed product or its rebranded successor by the same makers',
          false: 'The page is about something unrelated: a different business, spam, gambling, adult content, a parked or for-sale domain',
        },
      },
      kind: {
        type: 'choice',
        instructions: 'What does the website show today?',
        criteria: {
          product: 'A software product or company site',
          parked: 'A parked, expired or for-sale domain, or a hosting placeholder',
          gambling: 'Gambling, betting, casino or sports streaming',
          adult: 'Adult content',
          spam: 'Spam, SEO link farm, scam, pharma or unrelated content farm',
          other: 'Some other unrelated business or content',
        },
      },
    },
  };
}

// JEV answers -> hijacked reason or null. Conservative: needs a confident "not the same site".
export function hijackVerdict(answers: Record<string, any> | null): string | null {
  const same = Number(answers?.same?.noul);
  const kind = typeof answers?.kind?.choice === 'string' ? answers.kind.choice : null;
  if (!Number.isFinite(same) || same > 0.15 || !kind || kind === 'product') return null;
  return kind === 'parked' ? 'the domain is parked or for sale' : `the domain now shows ${kind === 'other' ? 'an unrelated site' : `${kind} content`}`;
}

// Visible text from HTML (enough for a verdict; not a general HTML parser).
export function htmlToSnapshot(html: string, status: number, finalUrl: string): PageSnapshot {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const text = html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return { status, error: null, finalUrl, title: decodeEntities(title), text };
}
const decodeEntities = (s: string) => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
