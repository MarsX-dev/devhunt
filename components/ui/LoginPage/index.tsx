'use client';

import { useSupabase } from '@/components/supabase/provider';
import Brand from '@/components/ui/Brand';
import { useState } from 'react';
import { GithubProvider, GoogleProvider } from '../AuthProviderButtons';

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/';
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to including trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

export default () => {
  const { supabase } = useSupabase();
  const [isGoogleAuthLoad, setGoogleAuthLoad] = useState<boolean>(false);
  const [isGithubAuthLoad, setGithubAuthLoad] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setGoogleAuthLoad(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getURL(),
      },
    });
  };

  const handleGithubLogin = async () => {
    setGithubAuthLoad(true);
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getURL(),
      },
    });
  };

  return (
    <section>
      <div className="h-screen px-4 w-full flex items-center justify-center">
        <div className="text-center max-w-xl">
          <div className="space-y-3">
            <Brand w="180" h="50" className="mx-auto" />
            <h1 className="text-slate-50 text-2xl font-semibold">Log in to your account</h1>
            <p className="text-slate-300 whitespace-pre-wrap">
              We use GitHub, and Google provider to keep it simple and easy for our users to login. Let's explore together, the legit way!
            </p>
          </div>
          <GithubProvider isLoad={isGithubAuthLoad} onClick={handleGithubLogin} />
          <GoogleProvider isLoad={isGoogleAuthLoad} onClick={handleGoogleLogin} />
        </div>
      </div>
    </section>
  );
};
