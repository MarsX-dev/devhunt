import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';
import { type Database } from '@/utils/supabase/types';
import { isDeletedAccountError } from '@/utils/deletion';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // Deleted accounts are banned in Supabase Auth: tell them instead of silently bouncing home.
  const deleted = () => NextResponse.redirect(new URL('/login?deleted=1', requestUrl.origin));
  if (isDeletedAccountError(requestUrl.searchParams.get('error_description'))) return deleted();

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (isDeletedAccountError(error?.message)) return deleted();
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin);
}
