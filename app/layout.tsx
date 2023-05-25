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
