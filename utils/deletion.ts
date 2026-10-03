// Deleting tools and accounts (pure helpers, tested). Server side: utils/server/deletion.ts.

export const DELETED_NAME = 'Deleted user';

// The user must type the tool's name (or their username) exactly, ignoring case, spaces and a
// leading "@" - so a stray click can never delete anything.
export function confirmMatches(input: unknown, expected: string | null | undefined): boolean {
  const norm = (s: string) => s.trim().replace(/^@/, '').replace(/\s+/g, ' ').toLowerCase();
  return typeof input === 'string' && !!expected && norm(input).length > 0 && norm(input) === norm(expected);
}

// What an anonymized profile looks like (username stays unique, nothing personal is left).
export function anonymizedProfile(id: string, now = new Date()) {
  return {
    username: `deleted-${id.replace(/-/g, '').slice(0, 10)}`,
    full_name: DELETED_NAME,
    avatar_url: null,
    website_url: null,
    headline: null,
    about: null,
    twitter: null,
    social_url: null,
    deleted_at: now.toISOString(),
  };
}

// Sign-in errors from Supabase for a banned (deleted) account.
export const isDeletedAccountError = (message: string | null | undefined) => !!message && /banned|user.*(deleted|disabled)/i.test(message);
