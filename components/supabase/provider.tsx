'use client';

import type { Session } from '@supabase/auth-helpers-nextjs';
import { createContext, useContext, useState } from 'react';
import type { TypedSupabaseClient } from '@/app/layout';
import { createBrowserClient } from '@/utils/supabase/browser';
import { type Profile } from '@/utils/supabase/types';

type MaybeSession = Session | null

interface SupabaseContext {
  supabase: TypedSupabaseClient
  session: MaybeSession
  user: Profile
}

// @ts-expect-error disable args error
const Context = createContext<SupabaseContext>();

export default function SupabaseProvider({
  children,
  session,
  user,
}: {
  children: React.ReactNode
  session: MaybeSession
  user: Profile
}): JSX.Element {
  const [supabase] = useState(() => createBrowserClient());

  return (
    <Context.Provider value={{ supabase, session, user }}>
      <>{children}</>
    </Context.Provider>
  );
}

export const useSupabase = (): SupabaseContext => useContext(Context);
