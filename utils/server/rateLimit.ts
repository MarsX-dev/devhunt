import { NextResponse } from 'next/server';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// Request limits for endpoints that cost money (AI, scraping, email) or write rows, counted in the
// rate_limits table. Fails open: if the check itself errors, the request goes through (and is logged),
// so a database hiccup never locks real users out.
export async function withinLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await serviceClient.rpc('rate_limit_hit' as never, { _key: key, _max: max, _window_seconds: windowSeconds } as never);
  if (error) {
    console.error('rate limit check failed:', key, error.message);
    return true;
  }
  return data !== false;
}

// The visitor's IP as Vercel reports it (the first x-forwarded-for entry).
export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

export const tooManyRequests = (message = 'Too many requests, please try again later.') => NextResponse.json({ error: message }, { status: 429 });
