'use client'

import { useSupabase } from '@/components/supabase/provider'

// Supabase auth needs to be triggered client-side
export default function Auth() {
  const { supabase, session } = useSupabase()

  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    })

    if (error) {
      console.log({ error })
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.log({ error })
    }
  }

  // this `session` is from the root loader - server-side
  // therefore, it can safely be used to conditionally render
  // SSR pages without issues with hydration

  return session ? (
    <div>
      <span className="px-2">{session.user.email}</span>
      <button
        onClick={handleLogout}
        className="py-3 px-4 font-medium text-center text-white active:shadow-none rounded-lg shadow bg-slate-800 md:bg-[linear-gradient(179.23deg,_#1E293B_0.66%,_rgba(30,_41,_59,_0)_255.99%)] hover:bg-slate-700 duration-150"
      >
        Logout
      </button>
    </div>
  ) : (
    <button
      onClick={handleGitHubLogin}
      className="py-3 px-4 font-medium text-center text-white active:shadow-none rounded-lg shadow bg-slate-800 md:bg-[linear-gradient(179.23deg,_#1E293B_0.66%,_rgba(30,_41,_59,_0)_255.99%)] hover:bg-slate-700 duration-150"
    >
      Sign In
    </button>
  )
}
