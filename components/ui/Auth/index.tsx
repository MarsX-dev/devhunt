'use client'

import { useSupabase } from '@/components/supabase/provider'
import Button from '../Button'

// Supabase auth needs to be triggered client-side
export default function Auth() {
  const { supabase, session } = useSupabase()

  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    })

    if (error != null) {
      console.log({ error })
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error != null) {
      console.log({ error })
    }
  }

  // this `session` is from the root loader - server-side
  // therefore, it can safely be used to conditionally render
  // SSR pages without issues with hydration

  return session != null ? (
    <div>
      <span className="px-2">{session.user.email}</span>
      <Button variant='shiny' className=' w-full md:w-auto' onClick={handleLogout}>
        Logout
      </Button>
    </div>
  ) : (
    <Button variant='shiny' className=' w-full md:w-auto' onClick={handleGitHubLogin}>
      Sign In
    </Button>
  )
}
