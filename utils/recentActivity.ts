import { unstable_cache } from 'next/cache';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { type RecentActivity } from '@/utils/activity';

// Latest joins, upvotes and comments plus today's votes per contestant (server-only RPC).
export const getRecentActivity = unstable_cache(
  async (): Promise<RecentActivity | null> => {
    const { data, error } = await serviceClient.rpc('get_recent_activity' as never);
    if (error) {
      console.error('recent activity failed:', error.message);
      return null;
    }
    return data as unknown as RecentActivity;
  },
  ['recent-activity'],
  { revalidate: 60 },
);
