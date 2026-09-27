'use client';

import { useSupabase } from '@/components/supabase/provider';
import Brand from '@/components/ui/Brand';
import { useEffect, useState } from 'react';
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
  const [deleted, setDeleted] = useState(false); // ?deleted=1: the account was deleted (and is banned)
  useEffect(() => setDeleted(new URLSearchParams(window.location.search).get('deleted') === '1'), []);

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
            <p className="text-slate-300 whitespace-pre-wrap mb-2">We use GitHub, and Google provider to filter out bots and fakes.</p>
            <p className="text-slate-300 whitespace-pre-wrap"><a className="text-orange-500 whitespace-pre-wrap" href="/the-story">Read the Rules </a>for voting and what dev tools you can submit here</p>
          </div>
          {deleted && (
            <p role="alert" className="mx-auto mt-6 max-w-md rounded-xl border border-red-500/40 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200">
              This account has been deleted. It can&apos;t sign in or sign up on DevHunt anymore.
            </p>
          )}
          <GithubProvider isLoad={isGithubAuthLoad} onClick={handleGithubLogin} />
          <GoogleProvider isLoad={isGoogleAuthLoad} onClick={handleGoogleLogin} />
        </div>
      </div>
    </section>
  );
};
