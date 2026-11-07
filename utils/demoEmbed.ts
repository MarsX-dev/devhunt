/**
 * Interactive product demos embedded on tool pages.
 *
 * Makers paste a share link or the iframe embed code their demo tool gives them. That URL is never
 * used as the iframe src: the host has to match a supported provider exactly, the demo id has to be
 * a plain token, and the embed URL is rebuilt from the provider's own template. Tool pages resolve
 * the stored value again when they render, so a row edited outside the launch form can't embed
 * anything else.
 *
 * Kept free of imports so `npm test` can run it with Node's built-in test runner.
 */

export type DemoProviderId = 'arcade' | 'atriumkit' | 'navattic' | 'storylane' | 'supademo';

export interface DemoEmbed {
  provider: DemoProviderId;
  providerName: string;
  /** iframe src, rebuilt from the provider's template. */
  embedUrl: string;
  /** The demo's own page, for "Open in new tab". */
  shareUrl: string;
  /** The link as the maker gave it (iframe src pulled out of embed code), which is what gets stored. */
  sourceUrl: string;
  /** iframe `allow` attribute. */
  allow: string;
  /** CSS aspect-ratio for the frame. */
  aspectRatio: string;
}

interface ProviderUrls {
  embedUrl: string;
  shareUrl: string;
}

interface Provider {
  id: DemoProviderId;
  name: string;
  /** Linked from the launch form. */
  homepage: string;
  hosts: string[];
  allow: string;
  aspectRatio: string;
  /** Embed and share URLs for a demo link on one of `hosts`, or null when the path isn't a demo. */
  resolve: (host: string, path: string[], query: URLSearchParams) => ProviderUrls | null;
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

const isId = (s: string | undefined): s is string => s !== undefined && ID_RE.test(s);

/** The id in `/<prefix>/<id>`, for each accepted prefix. */
function idAfter(path: string[], prefixes: string[]): string | null {
  return path.length === 2 && prefixes.includes(path[0]) && isId(path[1]) ? path[1] : null;
}

/** Copies the query parameters that pass their check, so only known player options reach the iframe. */
function pickQuery(query: URLSearchParams, allowed: Record<string, RegExp>): string {
  const out = new URLSearchParams();
  for (const [key, re] of Object.entries(allowed)) {
    const value = query.get(key);
    if (value !== null && re.test(value)) out.set(key, value);
  }
  const qs = out.toString();
  return qs ? `?${qs}` : '';
}

// AtriumKit player options (packages/shared/src/embed.ts in atrium-kit). Access tokens (`t`) and
// personal links (`p`) are left out on purpose: a public listing shouldn't unlock a gated demo or
// count every visitor as one recipient.
const ATRIUMKIT_DEMO_QUERY: Record<string, RegExp> = {
  mode: /^(guided|free)$/,
  progress: /^[01]$/,
  brand: /^0$/,
  start: ID_RE,
  lang: /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$/,
  sound: /^0$/,
  captions: /^[01]$/,
};

const ATRIUMKIT_COLLECTION_QUERY: Record<string, RegExp> = {
  item: ID_RE,
  lang: ATRIUMKIT_DEMO_QUERY.lang,
};

// Alphabetical, so no provider gets top billing in the launch form.
const PROVIDERS: Provider[] = [
  {
    id: 'arcade',
    name: 'Arcade',
    homepage: 'https://www.arcade.software/',
    hosts: ['app.arcade.software', 'demo.arcade.software'],
    allow: 'clipboard-write; fullscreen',
    aspectRatio: '16 / 9',
    // app.arcade.software/share/<id>, demo.arcade.software/share/<id>, or the embed src demo.arcade.software/<id>
    resolve: (host, path) => {
      const id = idAfter(path, ['share']) ?? (host === 'demo.arcade.software' && path.length === 1 && isId(path[0]) ? path[0] : null);
      if (!id || id === 'share') return null;
      return { embedUrl: `https://demo.arcade.software/${id}?embed`, shareUrl: `https://app.arcade.software/share/${id}` };
    },
  },
  {
    id: 'atriumkit',
    name: 'AtriumKit',
    // www: the bare domain's redirect drops the query string, and with it ref=devhunt.
    homepage: 'https://www.atriumkit.com/',
    hosts: ['atriumkit.com', 'www.atriumkit.com'],
    allow: 'autoplay; fullscreen; clipboard-write',
    aspectRatio: '16 / 9',
    // Demos: /d/<slug>[/<title>], /embed/<slug>. Collections: /c/<slug>[/<title>], /embed/c/<slug>.
    resolve: (_host, path, query) => {
      const [first, second, third] = path;
      const isCollection = (first === 'c' && path.length <= 3) || (first === 'embed' && second === 'c' && path.length === 3);
      const isDemo = (first === 'd' && path.length <= 3) || (first === 'embed' && path.length === 2 && second !== 'c');
      const slug = first === 'embed' && second === 'c' ? third : second;
      if (!isId(slug) || (!isCollection && !isDemo)) return null;
      if (isCollection) {
        const qs = pickQuery(query, ATRIUMKIT_COLLECTION_QUERY);
        return { embedUrl: `https://atriumkit.com/embed/c/${slug}${qs}`, shareUrl: `https://atriumkit.com/c/${slug}${qs}` };
      }
      const qs = pickQuery(query, ATRIUMKIT_DEMO_QUERY);
      return { embedUrl: `https://atriumkit.com/embed/${slug}${qs}`, shareUrl: `https://atriumkit.com/d/${slug}${qs}` };
    },
  },
  {
    id: 'navattic',
    name: 'Navattic',
    homepage: 'https://www.navattic.com/',
    hosts: ['capture.navattic.com'],
    allow: 'fullscreen',
    aspectRatio: '16 / 10',
    // capture.navattic.com/<id> is both the share link and the embed src.
    resolve: (_host, path) => {
      if (path.length !== 1 || !isId(path[0])) return null;
      const url = `https://capture.navattic.com/${path[0]}`;
      return { embedUrl: url, shareUrl: url };
    },
  },
  {
    id: 'storylane',
    name: 'Storylane',
    homepage: 'https://www.storylane.io/',
    hosts: ['app.storylane.io'],
    allow: 'fullscreen',
    aspectRatio: '16 / 9',
    // Share link app.storylane.io/share/<id>; embed src app.storylane.io/demo/<id>?embed=inline.
    resolve: (_host, path) => {
      const id = idAfter(path, ['share', 'demo']);
      if (!id) return null;
      return { embedUrl: `https://app.storylane.io/demo/${id}?embed=inline`, shareUrl: `https://app.storylane.io/share/${id}` };
    },
  },
  {
    id: 'supademo',
    name: 'Supademo',
    homepage: 'https://supademo.com/',
    hosts: ['app.supademo.com'],
    allow: 'clipboard-write; fullscreen',
    aspectRatio: '16 / 9',
    // Share link app.supademo.com/demo/<id>; embed src app.supademo.com/embed/<id>.
    resolve: (_host, path) => {
      const id = idAfter(path, ['demo', 'embed']);
      if (!id) return null;
      return { embedUrl: `https://app.supademo.com/embed/${id}`, shareUrl: `https://app.supademo.com/demo/${id}` };
    },
  },
];

export const DEMO_PROVIDERS: Array<{ name: string; homepage: string }> = PROVIDERS.map(({ name, homepage }) => ({ name, homepage }));

export const DEMO_PROVIDER_NAMES: string[] = PROVIDERS.map(p => p.name);

/** "Arcade, AtriumKit, Navattic, Storylane or Supademo" */
export const DEMO_PROVIDERS_LABEL = `${DEMO_PROVIDER_NAMES.slice(0, -1).join(', ')} or ${
  DEMO_PROVIDER_NAMES[DEMO_PROVIDER_NAMES.length - 1]
}`;

/** The link in pasted input: the input itself, or the src of the iframe in a pasted embed snippet. */
export function extractDemoUrl(input: string): string {
  const trimmed = input.trim();
  const iframeSrc = /<iframe\b[^>]*?\ssrc\s*=\s*["']([^"']+)["']/i.exec(trimmed);
  return iframeSrc ? iframeSrc[1].replace(/&amp;/g, '&').trim() : trimmed;
}

/** Resolves a share link or embed snippet from a supported provider, or null for anything else. */
export function resolveDemoEmbed(input: string | null | undefined): DemoEmbed | null {
  if (!input) return null;
  const raw = extractDemoUrl(input);
  if (!raw) return null;

  let url: URL;
  try {
    // Accept "app.supademo.com/demo/abc" without a scheme; anything with another scheme fails below.
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password || url.port) return null;

  const host = url.hostname.toLowerCase();
  const provider = PROVIDERS.find(p => p.hosts.includes(host));
  if (!provider) return null;

  const path = url.pathname.split('/').filter(Boolean);
  const urls = provider.resolve(host, path, url.searchParams);
  if (!urls) return null;

  return {
    provider: provider.id,
    providerName: provider.name,
    embedUrl: urls.embedUrl,
    shareUrl: urls.shareUrl,
    sourceUrl: url.toString(),
    allow: provider.allow,
    aspectRatio: provider.aspectRatio,
  };
}
