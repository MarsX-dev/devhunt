import { cookies } from 'next/headers';
import { type SupabaseClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { type Database } from '@/utils/supabase/types';

export const createServerClient = (): SupabaseClient<Database> =>
  createServerComponentClient<Database>({ cookies });
