// Profile links: whatever people type (`@handle`, `x.com/foo`, `http://twitter.com/foo `, a full URL) becomes
// { platform, handle, url }. Profiles store handles in `profiles.social_links`; URLs are built when rendering.
// Pure and import-free: the backfill script (scripts/normalize-social-links.mjs) runs it directly under Node.

export type SocialPlatform =
  | 'x'
  | 'github'
  | 'linkedin'
  | 'bluesky'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'producthunt'
  | 'peerlist'
  | 'devto'
  | 'threads'
  | 'tiktok'
  | 'telegram'
  | 'mastodon';

export interface SocialLink {
  platform: SocialPlatform | 'website';
  handle: string; // platform handle, or the full URL for 'website'
  url: string;
}

// Stored in profiles.social_links. `other` holds URLs of sites we don't know.
export type SocialLinks = Partial<Record<SocialPlatform, string>> & { other?: string[] };

interface PlatformDef {
  name: string;
  hosts: string[];
  // Handle from a URL path (and query), or null when the path isn't a profile.
  fromPath: (path: string, query: URLSearchParams) => string | null;
  // Handle typed on its own (the field says which platform it is).
  bare: RegExp;
  url: (handle: string) => string;
  label: (handle: string) => string;
}

const seg = (path: string) =>
  path
    .split('/')
    .filter(Boolean)
    .map(s => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });

const firstSegment = (re: RegExp, reserved: string[] = []) => (path: string) => {
  const [first] = seg(path);
  if (!first) return null;
  const handle = first.replace(/^@/, '');
  return re.test(handle) && !reserved.includes(handle.toLowerCase()) ? handle : null;
};

const atSegment = (re: RegExp) => (path: string) => {
  const [first] = seg(path);
  if (!first?.startsWith('@')) return null;
  const handle = first.slice(1);
  return re.test(handle) ? handle : null;
};

const X_HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const GITHUB_HANDLE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const INSTAGRAM_HANDLE = /^[A-Za-z0-9._]{1,30}$/;
const LINKEDIN_SLUG = /^[\p{L}\p{N}_\-.%]{2,100}$/u;
const SIMPLE_HANDLE = /^[A-Za-z0-9_\-.]{1,50}$/;

export const PLATFORMS: Record<SocialPlatform, PlatformDef> = {
  x: {
    name: 'X',
    hosts: ['x.com', 'twitter.com'],
    fromPath: firstSegment(X_HANDLE, ['home', 'i', 'intent', 'share', 'search', 'hashtag', 'explore', 'settings', 'messages', 'notifications', 'login', 'signup']),
    bare: X_HANDLE,
    url: h => `https://x.com/${h}`,
    label: h => `@${h}`,
  },
  github: {
    name: 'GitHub',
    hosts: ['github.com'],
    // A repo link (github.com/user/repo) still points at its owner.
    fromPath: firstSegment(GITHUB_HANDLE, ['orgs', 'features', 'sponsors', 'settings', 'marketplace', 'topics', 'apps', 'about', 'pricing', 'login', 'explore', 'collections', 'trending']),
    bare: GITHUB_HANDLE,
    url: h => `https://github.com/${h}`,
    label: h => h,
  },
  linkedin: {
    name: 'LinkedIn',
    hosts: ['linkedin.com'],
    fromPath: path => {
      const [kind, slug] = seg(path);
      if (!slug || !['in', 'company', 'school', 'pub'].includes(kind?.toLowerCase())) return null;
      return LINKEDIN_SLUG.test(slug) ? `${kind.toLowerCase()}/${slug}` : null;
    },
    bare: LINKEDIN_SLUG,
    url: h => `https://www.linkedin.com/${h.includes('/') ? h.split('/').map(encodeURIComponent).join('/') : `in/${encodeURIComponent(h)}`}`,
    label: () => 'LinkedIn',
  },
  bluesky: {
    name: 'Bluesky',
    hosts: ['bsky.app'],
    fromPath: path => {
      const [kind, handle] = seg(path);
      return kind === 'profile' && handle && /^[A-Za-z0-9.\-:]{3,253}$/.test(handle) ? handle.toLowerCase() : null;
    },
    bare: /^[A-Za-z0-9.\-]{3,253}$/,
    url: h => `https://bsky.app/profile/${h}`,
    label: h => `@${h}`,
  },
  youtube: {
    name: 'YouTube',
    hosts: ['youtube.com'],
    fromPath: path => {
      const [first, second] = seg(path);
      if (first?.startsWith('@') && /^@[\p{L}\p{N}_.\-]{1,100}$/u.test(first)) return first;
      if (['c', 'channel', 'user'].includes(first) && second && /^[\p{L}\p{N}_\-]{1,100}$/u.test(second)) return `${first}/${second}`;
      return null;
    },
    bare: /^@?[\p{L}\p{N}_.\-]{1,100}$/u,
    url: h => `https://www.youtube.com/${h.includes('/') || h.startsWith('@') ? h : `@${h}`}`,
    label: h => (h.startsWith('@') ? h : 'YouTube'),
  },
  instagram: {
    name: 'Instagram',
    hosts: ['instagram.com'],
    fromPath: firstSegment(INSTAGRAM_HANDLE, ['p', 'reel', 'reels', 'explore', 'stories', 'accounts', 'direct']),
    bare: INSTAGRAM_HANDLE,
    url: h => `https://www.instagram.com/${h}`,
    label: h => `@${h}`,
  },
  facebook: {
    name: 'Facebook',
    hosts: ['facebook.com', 'fb.com'],
    fromPath: (path, query) => {
      const [first] = seg(path);
      if (first === 'profile.php') return /^\d+$/.test(query.get('id') ?? '') ? `profile.php?id=${query.get('id')}` : null;
      return firstSegment(/^[A-Za-z0-9.\-]{2,80}$/, ['sharer', 'share', 'groups', 'events', 'watch', 'login', 'pages', 'people', 'home.php'])(path);
    },
    bare: /^[A-Za-z0-9.\-]{2,80}$/,
    url: h => `https://www.facebook.com/${h}`,
    label: () => 'Facebook',
  },
  producthunt: {
    name: 'Product Hunt',
    hosts: ['producthunt.com'],
    fromPath: atSegment(/^[A-Za-z0-9_]{1,40}$/),
    bare: /^[A-Za-z0-9_]{1,40}$/,
    url: h => `https://www.producthunt.com/@${h}`,
    label: h => `@${h}`,
  },
  peerlist: {
    name: 'Peerlist',
    hosts: ['peerlist.io'],
    fromPath: firstSegment(SIMPLE_HANDLE, ['jobs', 'scroll', 'projects', 'blog', 'company', 'login', 'signup']),
    bare: SIMPLE_HANDLE,
    url: h => `https://peerlist.io/${h}`,
    label: h => h,
  },
  devto: {
    name: 'DEV',
    hosts: ['dev.to'],
    fromPath: firstSegment(/^[A-Za-z0-9_]{1,50}$/, ['t', 'search', 'top', 'latest', 'enter', 'settings']),
    bare: /^[A-Za-z0-9_]{1,50}$/,
    url: h => `https://dev.to/${h}`,
    label: h => h,
  },
  threads: {
    name: 'Threads',
    hosts: ['threads.net', 'threads.com'],
    fromPath: atSegment(INSTAGRAM_HANDLE),
    bare: INSTAGRAM_HANDLE,
    url: h => `https://www.threads.net/@${h}`,
    label: h => `@${h}`,
  },
  tiktok: {
    name: 'TikTok',
    hosts: ['tiktok.com'],
    fromPath: atSegment(/^[A-Za-z0-9_.]{2,24}$/),
    bare: /^[A-Za-z0-9_.]{2,24}$/,
    url: h => `https://www.tiktok.com/@${h}`,
    label: h => `@${h}`,
  },
  telegram: {
    name: 'Telegram',
    hosts: ['t.me', 'telegram.me'],
    fromPath: firstSegment(/^[A-Za-z0-9_]{5,32}$/, ['joinchat', 'share', 's', 'addstickers']),
    bare: /^[A-Za-z0-9_]{5,32}$/,
    url: h => `https://t.me/${h}`,
    label: h => `@${h}`,
  },
  mastodon: {
    name: 'Mastodon',
    hosts: [], // any server: only the `@user@server` form is recognised
    fromPath: () => null,
    bare: /^[A-Za-z0-9_]{1,30}@[a-z0-9.\-]+\.[a-z]{2,}$/i,
    url: h => {
      const [user, server] = h.split('@');
      return `https://${server}/@${user}`;
    },
    label: h => `@${h}`,
  },
};

export const PLATFORM_ORDER: SocialPlatform[] = ['x', 'github', 'linkedin', 'bluesky', 'youtube', 'producthunt', 'peerlist', 'devto', 'mastodon', 'threads', 'instagram', 'facebook', 'tiktok', 'telegram'];

const JUNK = /^(n\/?a|none|nil|null|no|nothing|-+|_+|\.+|x|twitter|facebook|linkedin|instagram|github|tiktok|youtube|telegram)$/i;

// "Telegram: foo", "twitter - @foo", "github foo", "x/foo"
const PREFIXED = new RegExp(`^(${['x', 'twitter', 'github', 'linkedin', 'instagram', 'insta', 'facebook', 'fb', 'telegram', 'tg', 'youtube', 'tiktok', 'bluesky', 'threads'].join('|')})(?:\\s*[:\\-–]\\s*|\\s+|\\/)(\\S+)$`, 'i');
const PREFIX_PLATFORM: Record<string, SocialPlatform> = {
  x: 'x',
  twitter: 'x',
  github: 'github',
  linkedin: 'linkedin',
  instagram: 'instagram',
  insta: 'instagram',
  facebook: 'facebook',
  fb: 'facebook',
  telegram: 'telegram',
  tg: 'telegram',
  youtube: 'youtube',
  tiktok: 'tiktok',
  bluesky: 'bluesky',
  threads: 'threads',
};

const platformOfHost = (host: string): SocialPlatform | null =>
  (Object.keys(PLATFORMS) as SocialPlatform[]).find(p => PLATFORMS[p].hosts.some(h => host === h || host.endsWith(`.${h}`))) ?? null;

// Repairs what people type into something `new URL` accepts: `https:foo.com`, `http//foo`, `foo.com/x`.
function toUrl(raw: string): URL | null {
  let s = raw.trim().replace(/\s+/g, '');
  if (!s) return null;
  s = s.replace(/^(https?)(:\/?|\/\/?)(?!\/)/i, '$1://').replace(/^\/\//, '');
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/\.+$/, '');
    // A real public host: letters in the TLD, no IPs or localhost.
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(host) && !/^([a-z0-9-]+\.)+xn--[a-z0-9-]+$/i.test(host)) return null;
    url.hostname = host;
    return url;
  } catch {
    return null;
  }
}

const TRACKING = /^(utm_|fbclid|gclid|ref$|ref_src|s$|t$|si$|igshid|mibextid)/i;

// Any website: https added when missing, host lowercased, tracking params and a bare trailing slash dropped.
export function normalizeUrl(input: string | null | undefined): string | null {
  if (!input || /\s/.test(input.trim())) return null;
  const url = toUrl(input);
  if (!url) return null;
  url.hostname = url.hostname.toLowerCase();
  for (const key of Array.from(url.searchParams.keys())) if (TRACKING.test(key)) url.searchParams.delete(key);
  url.hash = '';
  const out = url.toString();
  return url.pathname === '/' && !url.search ? out.replace(/\/$/, '') : out;
}

export function socialLink(platform: SocialPlatform, handle: string): SocialLink {
  return { platform, handle, url: PLATFORMS[platform].url(handle) };
}

// Parses one typed link. `hint` is the platform of the field it was typed into, which lets bare handles work.
// Returns null for junk. A URL of another platform is returned as that platform (the caller decides).
export function parseSocialLink(input: string | null | undefined, hint?: SocialPlatform): SocialLink | null {
  let raw = (input ?? '').trim();
  if (!raw || JUNK.test(raw)) return null;

  const prefixed = raw.match(PREFIXED);
  if (prefixed && !prefixed[2].includes('.')) return parseSocialLink(prefixed[2], PREFIX_PLATFORM[prefixed[1].toLowerCase()]);
  if (prefixed) raw = prefixed[2];
  if (/\s/.test(raw)) return null;

  // Mastodon `@user@server` (or `user@server` in the Mastodon field).
  const masto = raw.replace(/^@/, '');
  if (PLATFORMS.mastodon.bare.test(masto) && (raw.startsWith('@') || hint === 'mastodon')) return socialLink('mastodon', masto.toLowerCase());

  const looksLikeUrl = /^https?(:|\/\/)/i.test(raw) || /^[^@\s/]+\.[a-z]{2,}(\/|$|\?)/i.test(raw) || /^www\./i.test(raw);
  const handle = raw.replace(/^@/, '').replace(/\/+$/, '');
  // With a hint, a bare handle wins even when it has a dot (Bluesky `name.bsky.social`, LinkedIn `john.doe`).
  const asHandle = !!hint && hint !== 'mastodon' && !/[/:]/.test(handle) && !/^www\./i.test(handle) && PLATFORMS[hint].bare.test(handle) && !platformOfHost(handle.toLowerCase());
  if (!looksLikeUrl || asHandle) {
    if (!asHandle || !hint) return null;
    if (hint === 'bluesky') return socialLink('bluesky', (handle.includes('.') ? handle : `${handle}.bsky.social`).toLowerCase());
    if (hint === 'linkedin') return socialLink('linkedin', `in/${handle}`);
    if (hint === 'youtube') return socialLink('youtube', handle.startsWith('@') ? handle : `@${handle}`);
    return socialLink(hint, handle);
  }

  const url = toUrl(raw);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^(www|m|mobile)\./, '');
  const platform = platformOfHost(host);
  if (platform) {
    const handle = PLATFORMS[platform].fromPath(url.pathname, url.searchParams);
    if (handle) return socialLink(platform, handle);
    // A known site but not a profile page (a post, a search): keep it as a plain link.
  }
  const website = normalizeUrl(url.toString());
  return website ? { platform: 'website', handle: website, url: website } : null;
}

// Links in display order, from social_links, falling back to the legacy social_url for rows not yet migrated.
export function profileLinks(profile: { social_links?: unknown; social_url?: string | null }): SocialLink[] {
  const stored = (profile.social_links ?? null) as SocialLinks | null;
  if (!stored || typeof stored !== 'object') {
    const legacy = parseSocialLink(profile.social_url);
    return legacy ? [legacy] : [];
  }
  // Users can write this column directly (RLS allows their own row), so every value is re-parsed here:
  // nothing but a well-formed profile or http(s) URL ever reaches an href.
  const links: SocialLink[] = [];
  for (const platform of PLATFORM_ORDER) {
    const handle = stored[platform];
    if (typeof handle !== 'string' || !handle) continue;
    const link = platform === 'mastodon' ? parseSocialLink(`@${handle}`) : parseSocialLink(PLATFORMS[platform].url(handle));
    if (link?.platform === platform && link.handle === handle) links.push(link);
  }
  for (const url of Array.isArray(stored.other) ? stored.other : []) {
    const clean = typeof url === 'string' ? normalizeUrl(url) : null;
    if (clean && /^https?:\/\//.test(clean)) links.push({ platform: 'website', handle: clean, url: clean });
  }
  return links;
}

export function linkLabel(link: SocialLink): string {
  if (link.platform === 'website') return link.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  return PLATFORMS[link.platform].label(link.handle);
}

export const platformName = (platform: SocialLink['platform']) => (platform === 'website' ? 'Website' : PLATFORMS[platform].name);

// The platforms with their own field on the profile form; everything else goes in "More links".
export const FIELD_PLATFORMS = ['x', 'github', 'linkedin'] as const;
export type FieldPlatform = (typeof FIELD_PLATFORMS)[number];

export interface LinksInput {
  x?: string;
  github?: string;
  linkedin?: string;
  more?: string[]; // anything else, platform detected from the URL
}

export interface BuiltLinks {
  social_links: SocialLinks | null;
  social_url: string | null; // the first link, kept for the old column and the onboarding gate
  errors: Partial<Record<FieldPlatform | 'more', string>>;
}

// Turns the form's raw input into what gets stored. `verifiedGithub` (from GitHub sign-in) always wins.
export function buildLinks(input: LinksInput, verifiedGithub?: string | null): BuiltLinks {
  const stored: SocialLinks = {};
  const errors: BuiltLinks['errors'] = {};

  for (const field of FIELD_PLATFORMS) {
    const raw = input[field]?.trim();
    if (!raw) continue;
    const link = parseSocialLink(raw, field);
    if (!link) errors[field] = `That doesn't look like a ${PLATFORMS[field].name} profile. Paste the link or just the handle.`;
    else if (link.platform !== field) errors[field] = `That's a ${platformName(link.platform)} link, not ${PLATFORMS[field].name}.`;
    else stored[field] = link.handle;
  }
  if (verifiedGithub) stored.github = verifiedGithub;

  const other: string[] = [];
  for (const raw of input.more ?? []) {
    if (!raw?.trim()) continue;
    const link = parseSocialLink(raw);
    if (!link) {
      errors.more = `"${raw.trim().slice(0, 60)}" isn't a link. Paste the full address, like x.com/yourname.`;
      continue;
    }
    if (link.platform !== 'website' && !stored[link.platform]) stored[link.platform] = link.handle;
    else if (!other.includes(link.url)) other.push(link.url);
  }
  if (other.length) stored.other = other.slice(0, 10);

  const links = profileLinks({ social_links: stored });
  return { social_links: links.length ? stored : null, social_url: links[0]?.url ?? null, errors };
}
