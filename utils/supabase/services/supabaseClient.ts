import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient({
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
});
