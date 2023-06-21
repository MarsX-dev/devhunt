'use client';

import { useSupabase } from '@/components/supabase/provider';
import Button from '../Button';
import { useEffect, useState } from 'react';
import AvatarMenu from '../AvatarMenu';
import axios from 'axios';
// Supabase auth needs to be triggered client-side
export default function Auth({ onLogout }: { onLogout?: () => void }) {
  const { supabase, session, user } = useSupabase();
  const [isLoad, setLoad] = useState(false);

  const handleGitHubLogin = async () => {
    setLoad(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });

    if (error != null) {
      console.log({ error });
      setLoad(false);
    }
  };

  useEffect(() => {
    // console.log(session);
    if (session) {
      const { username, full_name } = user;
      supabase.auth.getUser(session?.access_token).then(async res => {
        const { user } = res.data;
        const identities = user?.identities?.[0];
        if (identities?.created_at == identities?.updated_at) {
          const DISCORD_USER_WEBHOOK = process.env.DISCORD_USER_WEBHOOK as string;
          const content = `**${full_name}** [open the profile](https://devhunt.org/@${username})`;
          await axios.post(DISCORD_USER_WEBHOOK, { content });
          await supabase.auth.signInWithOAuth({ provider: 'github' });
        }
      });
    }
  }, [session]);

  // console.log(session && session.user)

  // this `session` is from the root loader - server-side
  // therefore, it can safely be used to conditionally render
  // SSR pages without issues with hydration

  return session?.user ? (
    <div className="hidden md:block">
      <AvatarMenu session={session} onLogout={onLogout} />
    </div>
  ) : (
    <Button isLoad={isLoad} variant="shiny" className="justify-center w-full md:w-auto" onClick={handleGitHubLogin}>
      Sign In
    </Button>
  );
}
