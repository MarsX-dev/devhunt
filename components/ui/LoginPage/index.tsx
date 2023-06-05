'use client'

import { IconGithub } from '@/components/Icons'
import { useSupabase } from '@/components/supabase/provider'
import Brand from '@/components/ui/Brand'
import Button from '@/components/ui/Button/Button'
import { useState } from 'react'

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to including trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

export default () => {
  const { supabase } = useSupabase()
  const [isLoad, setLoad] = useState(false)

  const handleLogin = async () => {
    setLoad(true)
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getURL(),
      },
    })
  }

  return (
    <section>
      <div className="h-screen px-4 w-full flex items-center justify-center">
        <div className="text-center max-w-xl">
          <div className="space-y-3">
            <Brand w="180" h="50" className="mx-auto" />
            <h1 className="text-slate-50 text-2xl font-semibold">Log in to your account</h1>
            <p className="text-slate-300 whitespace-pre-wrap">We use GitHub login to keep it real and ensure no fake accounts sneak in for those pesky fake upvotes. 
            Let's explore together, the legit way!</p>
          </div>
          <Button
            isLoad={isLoad}
            child={<IconGithub />}
            onClick={handleLogin}
            className="text-sm font-medium mt-8 mx-auto flex text-slate-800 bg-slate-50 hover:bg-slate-200 active:bg-slate-100"
          >
            Continue with Github
          </Button>
        </div>
      </div>
    </section>
  )
}
