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
  { revalidate: 300 },
);

export const profileExists = unstable_cache(
  async (username: string) => {
    const { data } = await createBrowserClient().from('profiles').select('id').eq('username', username).maybeSingle();
    return !!data;
  },
  ['route-profile-exists'],
  { revalidate: 300 },
);

export const categoryExists = (slug: string) => categories.some(item => slug.replaceAll('-', ' ') == item.name.toLowerCase());
