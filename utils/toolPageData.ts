import { unstable_cache } from 'next/cache';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import ProfileService from '@/utils/supabase/services/profile';
import CommentService from '@/utils/supabase/services/comments';
import { getToolExtras } from '@/utils/toolExtras';
import { getToolProfile } from '@/utils/toolProfileData';

// Everything a tool page shows. `includeDeleted` is for the admin view of blocked tools.
export async function loadToolPageData(client: SupabaseClient, slug: string, includeDeleted = false) {
  const product = await new ProductsService(client as any).getBySlug(slug);
  if (!product || (product.deleted && !includeDeleted)) return null;
  const [owner, comments, extras, profile] = await Promise.all([
    new ProfileService(client as any).getById(product.owner_id as string),
    new CommentService(client as any).getByProductId(product.id),
    getToolExtras(product.id),
    getToolProfile(product.id),
  ]);
  return { product, owner, comments, extras, profile };
}
export type ToolPageData = NonNullable<Awaited<ReturnType<typeof loadToolPageData>>>;

// Shared by all visitors and cached for 30s: the page itself renders on every request (on Next 13.5
// an ISR page that 404s is cached with status 200), so its queries must not run per visit. Public
// data only (anon client): hidden tools come back as null, i.e. a 404.
export const getToolPageData = unstable_cache(async (slug: string) => loadToolPageData(createBrowserClient() as any, slug), ['tool-page'], { revalidate: 30 });
