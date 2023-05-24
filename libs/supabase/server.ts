import { headers, cookies } from 'next/headers';
import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/libs/database.types';

export const createServerClient = () => createServerComponentSupabaseClient<Database>({ headers, cookies });