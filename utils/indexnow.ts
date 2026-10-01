import { SITE_URL, toolPath } from '@/utils/sitemap';
import { monthPath } from '@/utils/roundups';

// IndexNow tells Bing (and through it ChatGPT search, Copilot) and Yandex which URLs changed, instead of
// waiting for a crawl. The key file is public/<key>.txt and must contain the key itself.
export const INDEXNOW_KEY = '6f2ec52fc3a4faced95247e7e7230602';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10_000; // IndexNow's per-request limit

export interface ChangedTool {
  slug: string;
}

// Changed tool pages (new launches, edits, removals: a removed page's 404 is news too) plus the pages listing
// them: home, upcoming and this month's roundup (/best/{year}/{month}), which changes with every launch.
export function indexNowPayload(tools: ChangedTool[], now = new Date()) {
  const month = monthPath({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 });
  const urls = Array.from(
    new Set([`${SITE_URL}/`, `${SITE_URL}/upcoming`, `${SITE_URL}${month}`, ...tools.map(t => `${SITE_URL}${toolPath(t.slug)}`)]),
  );
  return {
    host: new URL(SITE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls.slice(0, MAX_URLS),
  };
}
