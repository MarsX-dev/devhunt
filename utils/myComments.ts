// The comments this browser posted, per tool. Every posted comment is kept here, so the list can show
// the author their own comments even if the server never stored them (shadow-blocked spam, see
// app/api/comments/route.ts) - the spammer keeps seeing theirs and has no reason to try again.
const KEY = 'dh_my_comments';
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 100;

type Stored = { slug: string; comment: { id: number; user_id: string; created_at: string; [key: string]: unknown } };

function read(): Stored[] {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Stored[];
    return Array.isArray(items) ? items.filter(i => Date.now() - Date.parse(i.comment?.created_at) < MAX_AGE_MS) : [];
  } catch {
    return [];
  }
}

function write(items: Stored[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
  } catch {}
}

export function rememberComment(slug: string, comment: Stored['comment']) {
  write([...read().filter(i => i.comment.id !== comment.id), { slug, comment }]);
}

export function updateRememberedComment(id: number, patch: Record<string, unknown>) {
  write(read().map(i => (i.comment.id === id ? { ...i, comment: { ...i.comment, ...patch } } : i)));
}

export function forgetComment(id: number) {
  write(read().filter(i => i.comment.id !== id));
}

// This user's remembered comments on a tool, for merging into the list the server returned.
export function myComments(slug: string, userId: string) {
  return read()
    .filter(i => i.slug === slug && i.comment.user_id === userId)
    .map(i => i.comment);
}
