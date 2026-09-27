import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { deleteAccount } from '@/utils/server/deletion';
import { confirmMatches } from '@/utils/deletion';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { type Database } from '@/utils/supabase/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Deletes the signed-in user's own account (never anyone else's: the id comes from the verified
// session, not the request). The body must carry their username as typed ({ confirm }).
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const { data: profile } = await serviceClient.from('profiles').select('username, deleted_at').eq('id', user.id).maybeSingle();
  if (!profile || (profile as any).deleted_at) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!confirmMatches(body?.confirm, profile.username)) return NextResponse.json({ error: 'Type your username to confirm.' }, { status: 400 });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const result = await deleteAccount(user.id, session?.access_token ?? null);
  if (!result.ok) return NextResponse.json({ error: 'Could not delete the account, please try again.' }, { status: 500 });
  await supabase.auth.signOut().catch(() => null); // clears the auth cookies of this browser
  return NextResponse.json({ deleted: true, tools: result.tools });
}
