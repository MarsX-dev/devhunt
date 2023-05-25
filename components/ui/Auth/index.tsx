'use client'

import { useSupabase } from '@/components/supabase/provider'
import Button from '../Button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
// Supabase auth needs to be triggered client-side
export default function Auth() {
  const { supabase, session } = useSupabase()
  const router = useRouter()
  const [isLoad, setLoad] = useState(false)

  const handleGitHubLogin = async () => {
    setLoad(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    })

    if (error != null) {
      console.log({ error })
      setLoad(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    router.push('/')
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
      <Button isLoad={isLoad} variant="shiny" className="justify-center w-full md:w-auto" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  ) : (
    <Button isLoad={isLoad} variant="shiny" className="justify-center w-full md:w-auto" onClick={handleGitHubLogin}>
      Sign In
    </Button>
  )
}
