import { enrichmentEnabled, groqJson } from '@/utils/server/enrich';
import { MAKER_COMMENT_MAX } from '@/utils/makerComment';
import { type ScrapedPage } from '@/utils/toolImport';

// A first-person launch comment drafted from the tool's website, for the maker to edit on the submit
// form. Null when AI isn't configured, it's slow, or it fails (the form then uses the template).
export async function draftMakerComment(page: ScrapedPage): Promise<string | null> {
  if (!enrichmentEnabled()) return null;
  const system = [
    "You write the maker's first comment on their own DevHunt launch page (a launchpad for developer tools).",
    'First person, friendly and plain, 2-4 short sentences, under 400 characters. Say why they built it and what it does,',
    'using only facts from the page, then ask for feedback. No hashtags, no marketing superlatives, at most one emoji.',
    'Return JSON: {"comment": "..."}',
  ].join(' ');
  const user = [`URL: ${page.url}`, `Title: ${page.title ?? ''}`, `Description: ${page.description ?? ''}`, (page.markdown ?? '').slice(0, 4000)].join('\n');
  try {
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 15000));
    const result = (await Promise.race([groqJson(system, user, 800), timeout])) as { comment?: unknown } | null;
    const comment = typeof result?.comment === 'string' ? result.comment.trim() : '';
    return comment ? comment.slice(0, MAKER_COMMENT_MAX) : null;
  } catch (err) {
    console.error('maker comment draft failed:', (err as Error).message);
    return null;
  }
}
