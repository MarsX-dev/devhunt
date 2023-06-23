'use client';

import { useSupabase } from '@/components/supabase/provider';
import { useEffect, useState } from 'react';
import AvatarMenu from '../AvatarMenu';
import axios from 'axios';
import { usermaven } from '@/utils/usermaven';
import Button from '@/components/ui/Button';
import { IconGithub, IconGoogle, IconSearch } from '@/components/Icons';
// Supabase auth needs to be triggered client-side
export default function Auth({ onLogout }: { onLogout?: () => void }) {
  const { supabase, session, user } = useSupabase();
  const [isLoad, setLoad] = useState(false);

  const handleGoogleLogin = async () => {
    setLoad(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });

    if (error != null) {
      console.log({ error });
      setLoad(false);
    }
  };

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
          await usermaven.id({
            id: user?.id,
            email: user?.email,
            created_at: Date.now().toLocaleString(),
            first_name: full_name,
          });
          await supabase.auth.signInWithOAuth({ provider: 'github' });
        }
      });
    }
  }, [session]);

  // console.log(session && session.user)

  // this `session` is from the root loader - server-side
  // therefore, it can safely be used to conditionally render
  // SSR pages without issues with hydration

  return Boolean(session) ? (
    <div className="hidden md:block">
      <AvatarMenu session={session} onLogout={onLogout} />
    </div>
  ) : (
    <div className="flex items-center">
      <span className="me-3">Sign In</span>
      <Button isLoad={isLoad} variant="shiny" className="flex w-full md:w-auto me-2" onClick={handleGitHubLogin}>
        <IconGithub className="flex-none text-slate-50 me-2" />
        Github
      </Button>
      <Button isLoad={isLoad} variant="shiny" className="flex w-full md:w-auto" onClick={handleGoogleLogin}>
        <IconGoogle className="flex-none text-slate-400 me-2" />
        Google
      </Button>
    </div>
  );
}
