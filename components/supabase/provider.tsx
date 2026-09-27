'use client';

import type { Session } from '@supabase/auth-helpers-nextjs';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { TypedSupabaseClient } from '@/app/layout';
import { createBrowserClient } from '@/utils/supabase/browser';
import { type Profile } from '@/utils/supabase/types';

type MaybeSession = Session | null

interface SupabaseContext {
  supabase: TypedSupabaseClient
  session: MaybeSession
  user: Profile
  loading: boolean // true until the session (and the signed-in user's profile) is known
  refreshUser: () => Promise<void>
}

// @ts-expect-error disable args error
const Context = createContext<SupabaseContext>();

// The session is read in the browser, not by the server: pages carry no per-user HTML, so the CDN
// can cache them for everyone (the server reading cookies made every page render per request).
export default function SupabaseProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [supabase] = useState(() => createBrowserClient());
  const [session, setSession] = useState<MaybeSession>(null);
  const [user, setUser] = useState<Profile>(null as unknown as Profile);
  const [loading, setLoading] = useState(true);
  const userId = useRef<string | undefined>(undefined); // whose profile is loaded

  const loadProfile = async (id: string | undefined) => {
    userId.current = id;
    if (!id) {
      setUser(null as unknown as Profile);
      return;
    }
    const { data } = await supabase.from('profiles').select().eq('id', id).maybeSingle();
    setUser(data as Profile);
  };

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (alive) setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (userId.current !== next?.user.id) void loadProfile(next?.user.id);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const refreshUser = async (): Promise<void> => {
    await loadProfile(session?.user.id);
  };

  return (
    <Context.Provider value={{ supabase, session, user, loading, refreshUser }}>
      <>{children}</>
    </Context.Provider>
  );
}

export const useSupabase = (): SupabaseContext => useContext(Context);
