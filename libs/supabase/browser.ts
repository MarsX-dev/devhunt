import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/libs/database.types';

export const createBrowserClient = () => createBrowserSupabaseClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});