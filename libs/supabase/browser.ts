import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/libs/database.types';

export const createBrowserClient = () => createBrowserSupabaseClient<Database>();