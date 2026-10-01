// Follow rules for outbound links, in one place:
// - internal links (relative or devhunt.org): no rel, followed
// - John Rush's own products (list below): followed
// - a paid tool's own links (website, GitHub repo, releases, pricing page): followed
// - everything else a tool or a user adds (free tools, profiles, third-party mentions): nofollow
// - sponsor ads: "sponsored" (see components/ui/Sponsors)

export const SITE_DOMAIN = 'devhunt.org';

// John Rush's products and directories, from the links on https://johnrush.me (checked 2026-09-29).
// Subdomains match too (guide.johnrush.me, www.seobotai.com, ...).
export const OWN_PRODUCT_DOMAINS = [
  'johnrush.me',
  'johnrushx.substack.com',
  'marsx.dev',
  'unicornplatform.com',
  'seobotai.com',
  'listingbott.com',
  'indexrusher.com',
  'tinyadz.com',
  'countvisits.com',
  'filmgrail.com',
  'uigenerator.org',
  'saasemailer.com',
  'cofondr.com',
  'inboxbott.com',
  'allgpts.co',
  'hostedsoftware.org',
  'osssoftware.org',
  'nextjsstarter.com',
  'llmmodels.org',
  'mvpwizards.com',
  'aitoolfor.org',
  'topwebsitebuilders.org',
  'saassoftware.org',
  'bestaiagents.org',
  'directoryhunt.org',
  // From John's Ahrefs projects (2026-10-01) and his list: Float UI and the rest of the portfolio.
  'floatui.com',
  'float-ui.com',
  'rapidforms.co',
  'marketsy.ai',
  'lorem.space',
  'aibloggenerators.com',
  'lowcodeplatforms.org',
  'lowcodenocode.org',
  'indiemakerlist.com',
  'createinfluencer.com',
  'employeeremote.com',
  'minibusinessideas.com',
  'aiscraper.co',
  'seobesttools.org',
  'tailwindgpt.co',
  'vclist.org',
  'startupstools.com',
] as const;

// Lowercased host without "www.", or null for relative/invalid URLs. Bare domains ("example.com/x") count.
export function hostOf(url: string | null | undefined): string | null {
  const raw = (url ?? '').trim();
  if (!raw || raw.startsWith('/') || raw.startsWith('#') || raw.startsWith('?')) return null;
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.hostname.toLowerCase().replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

const matches = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

export function isInternal(url: string | null | undefined): boolean {
  const raw = (url ?? '').trim();
  if (raw.startsWith('/') || raw.startsWith('#') || raw.startsWith('?')) return !raw.startsWith('//');
  const host = hostOf(raw);
  return !!host && matches(host, SITE_DOMAIN);
}

export function isOwnProduct(url: string | null | undefined): boolean {
  const host = hostOf(url);
  return !!host && OWN_PRODUCT_DOMAINS.some(domain => matches(host, domain));
}

export interface RelOptions {
  paid?: boolean; // the link belongs to a paid tool (products.isPaid)
  ugc?: boolean; // user-generated (profile links, comments)
  sponsored?: boolean; // a paid ad
}

// The rel for an <a>. undefined for internal links (nothing to add).
export function relFor(url: string | null | undefined, { paid = false, ugc = false, sponsored = false }: RelOptions = {}): string | undefined {
  if (isInternal(url)) return undefined;
  if (sponsored) return 'sponsored noopener';
  if (isOwnProduct(url) || paid) return 'noopener';
  return ugc ? 'nofollow ugc noopener' : 'nofollow noopener';
}

// Sets the rel (and target) of every <a> in sanitized HTML, e.g. a tool description written by its owner.
// Any rel the author wrote is replaced, so a free tool can't make its links followed.
export function withLinkRels(html: string, options: RelOptions = {}): string {
  return html.replace(/<a\b([^>]*)>/gi, (_tag, attrs: string) => {
    const href = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const url = href ? href[1] ?? href[2] ?? href[3] ?? '' : '';
    const rest = attrs.replace(/\s(?:rel|target)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    const rel = relFor(url, options);
    return rel ? `<a${rest} target="_blank" rel="${rel}">` : `<a${rest}>`;
  });
}

// Blog articles (SEObot HTML): John's products followed, every other outside link nofollow (SEObot writes
// plain links to the third-party tools it mentions), internal links untouched.
export const blogLinkRels = (html: string): string => withLinkRels(html);
