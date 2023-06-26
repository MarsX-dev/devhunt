'use client';

import { useSupabase } from '@/components/supabase/provider';
import { useEffect, useState } from 'react';
import AvatarMenu from '../AvatarMenu';
import axios from 'axios';
import { usermaven } from '@/utils/usermaven';
import Button from '@/components/ui/Button';
import { IconGithub, IconGoogle, IconSearch } from '@/components/Icons';
import Modal from '@/components/ui/Modal';
import Brand from '@/components/ui/Brand';
import { GithubProvider, GoogleProvider } from '../AuthProviderButtons';
// Supabase auth needs to be triggered client-side
export default function Auth({ onLogout }: { onLogout?: () => void }) {
  const { supabase, session, user } = useSupabase();
  const [isGoogleAuthLoad, setGoogleAuthLoad] = useState<boolean>(false);
  const [isGithubAuthLoad, setGithubAuthLoad] = useState<boolean>(false);
  const [isModalActive, setModalActive] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setGoogleAuthLoad(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });

    if (error != null) {
      console.log({ error });
    }
    setGoogleAuthLoad(false);
  };

  const handleGitHubLogin = async () => {
    setGithubAuthLoad(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });

    if (error != null) {
      console.log({ error });
    }
    setGithubAuthLoad(false);
    setModalActive(false);
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
      <Button variant="shiny" onClick={() => setModalActive(true)}>
        Sign In
      </Button>
      <Modal variant="custom" isActive={isModalActive} onCancel={() => setModalActive(false)} className="max-w-md">
        <div className="text-center p-2">
          <div className="">
            <Brand w="130" h="40" className="mx-auto" />
            <h1 className="text-slate-50 text-lg font-semibold">Log in to your account</h1>
            <p className="text-slate-300">Let's explore together, the legit way!</p>
          </div>
          <GithubProvider isLoad={isGithubAuthLoad} onClick={handleGitHubLogin} className="w-full justify-center mt-4" />
          <GoogleProvider isLoad={isGoogleAuthLoad} onClick={handleGoogleLogin} className="w-full justify-center mt-2" />
        </div>
      </Modal>
    </div>
  );
}
