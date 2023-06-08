import { type SupabaseClient, createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type Database } from '@/utils/supabase/types';

export const createBrowserClient = (): SupabaseClient<Database> =>
  createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    isSingleton: true,
  });
