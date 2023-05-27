import { headers, cookies } from 'next/headers'
import { type SupabaseClient, createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from '@/libs/supabase/types'

export const createServerClient = (): SupabaseClient<Database> => createServerComponentSupabaseClient<Database>({
  headers,
  cookies,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
})
