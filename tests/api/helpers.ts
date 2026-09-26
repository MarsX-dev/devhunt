export const BASE_URL = (process.env.TEST_BASE_URL ?? 'http://localhost:3124').replace(/\/$/, '');
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const get = (path: string, init?: RequestInit) => fetch(`${BASE_URL}${path}`, { redirect: 'manual', ...init });

// A real user id (the owner's test account). Only ever used in calls that must be rejected.
export const SOME_USER_ID = '9eecebfe-f493-41eb-905a-4e0f6405f898';
export const SOME_PRODUCT_ID = 33467882;

export function supabase(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
}
