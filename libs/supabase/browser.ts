import { type SupabaseClient, createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from '@/libs/supabase/types'

export const createBrowserClient = (): SupabaseClient<Database> =>
  createBrowserSupabaseClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
