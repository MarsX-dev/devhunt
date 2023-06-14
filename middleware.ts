import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { type NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/utils/supabase/types';

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession(); // destructure the data object to obtain the session object
  if (session === null) return NextResponse.redirect(new URL('/login', req.nextUrl));
  return res;
}

export const config = {
  matcher: [
    // add the routes you wish the middleware to run in. You can also use regex
  ],
};
