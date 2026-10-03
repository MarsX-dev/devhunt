import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import categories from '@/utils/categories';

// Existence checks for route layouts. They run before the page's loading skeleton starts
// streaming, so unknown URLs still get a real 404 status (not a 200 with "not found" content).
export const toolExists = unstable_cache(
  async (slug: string) => {
    const { data } = await createBrowserClient().from('products').select('id').eq('slug', slug).eq('deleted', false).maybeSingle();
    return !!data;
  },
  ['route-tool-exists'],
  { revalidate: 60 }, // short: hiding or restoring a tool (website health) shows within a minute
);

// Profile caches are tagged per username; saving a profile (/api/profile) clears the old and new username's.
export const profileCacheTag = (username: string) => `profile:${username.toLowerCase()}`;

export const profileExists = (username: string) =>
  unstable_cache(
    async () => {
      const { data } = await createBrowserClient().from('profiles').select('id').eq('username', username).is('deleted_at', null).maybeSingle();
      return !!data;
    },
    ['route-profile-exists-v2', username], // deleted accounts are a 404
    { revalidate: 300, tags: [profileCacheTag(username)] },
  )();

export const categoryExists = (slug: string) => categories.some(item => slug.replaceAll('-', ' ') == item.name.toLowerCase());
