import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { type Database } from '@/utils/supabase/types';

// The signed-in user for a route handler, from the Supabase auth cookie (verified with Supabase Auth).
export async function getRouteUser() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
