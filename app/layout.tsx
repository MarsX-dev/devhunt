import Navbar from '@/components/ui/Navbar'
import './globals.css'
import { Inter } from 'next/font/google'

import SupabaseListener from '@/components/supabase/listener'
import SupabaseProvider from '@/components/supabase/provider'
import { createServerClient } from '@/libs/supabase/server'
import type { Database } from '@/libs/supabase/types'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'
import Footer from '@/components/ui/Footer/Footer'

export type TypedSupabaseClient = SupabaseClient<Database>

declare global {
  interface Window {
    usermavenQ: any // Replace 'any' with the appropriate type of 'usermavenQ'
  }
}

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dev Hunt – The best new DevTools in tech.',
  description: '',
}

// do not cache this layout
export const revalidate = 0

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en" className="bg-slate-900">
      <head>
        {/* <script
          src="https://t.usermaven.com/lib.js"
          data-key="UMuqbdiCeT"
          data-tracking-host="https://events.usermaven.com"
          data-autocapture="true"
          data-privacy-policy="strict"
          defer
        ></script>
        <script>
          window.usermaven = window.usermaven || (function()
          {(window.usermavenQ = window.usermavenQ || []).push(arguments)})
        </script> */}
      </head>
      <body className={inter.className}>
        <main>
          <SupabaseProvider session={session}>
            <SupabaseListener serverAccessToken={session?.access_token} />
            <Navbar />
            {children}
            <Footer />
          </SupabaseProvider>
        </main>
      </body>
    </html>
  )
}
