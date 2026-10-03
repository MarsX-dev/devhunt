// First-party analytics (pure helpers, tested). The beacon is components/Analytics, the endpoint
// app/api/hit. No cookies and no personal data: the browser keeps only the first/last visit day.

export const VISIT_KEY = 'dh_visit';
export const VISIT_HOUR_KEY = 'dh_visit_h'; // last visit hour (YYYY-MM-DDTHH, UTC), for hourly uniques

// Signs that this browser visited DevHunt before first-party tracking existed, so it isn't counted
// as a new unique visitor: the Clarity cookie (1 year) or keys the site has long stored.
const LEGACY_KEYS = ['isNewsletterActive', 'tool_href', 'last-tool'];
export function seenBefore(cookie: string, keys: string[]): boolean {
  return /(^|;\s*)_clck=/.test(cookie) || keys.some(k => LEGACY_KEYS.includes(k) || /^sb-.*-auth-token$/.test(k));
}

// stored: the previous value of VISIT_KEY (last visit day, YYYY-MM-DD) or null.
export function visitState(stored: string | null, today: string, legacy: boolean) {
  const known = !!stored && /^\d{4}-\d{2}-\d{2}$/.test(stored);
  return { newVisitor: !known && !legacy, newToday: stored !== today, next: today };
}

export function normalizePath(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/') || path.length > 300) return null;
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return /^[\w\-./~%@!$&'()*+,;=:]+$/.test(clean) ? clean.slice(0, 200) : null;
}

export function countryCode(value: string | null | undefined): string {
  return value && /^[A-Z]{2}$/.test(value) ? value : 'XX';
}

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|curl|wget|python|axios|node-fetch/i;
export const isBot = (userAgent: string | null) => !userAgent || BOT.test(userAgent);

// Coarse device class from the user agent (ad stats: desktop | tablet | mobile).
export function deviceClass(userAgent: string | null): 'desktop' | 'tablet' | 'mobile' {
  const ua = userAgent ?? '';
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android|Opera Mini|IEMobile/i.test(ua)) return 'mobile';
  return 'desktop';
}
