import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import ProfileService from '@/utils/supabase/services/profile';
import CommentService from '@/utils/supabase/services/comments';
import { getToolExtras } from '@/utils/toolExtras';
import { getToolProfile } from '@/utils/toolProfileData';

// Everything a tool page shows, shared by all visitors and cached for 30s: the page itself renders on
// every request (on Next 13.5 an ISR page that 404s is cached with status 200), so its queries must
// not run per visit. Public data only (anon client): hidden tools come back as null, i.e. a 404.
export const getToolPageData = unstable_cache(
  async (slug: string) => {
    const client = createBrowserClient();
    const product = await new ProductsService(client).getBySlug(slug);
    if (!product || product.deleted) return null;
    const [owner, comments, extras, profile] = await Promise.all([
      new ProfileService(client).getById(product.owner_id as string),
      new CommentService(client).getByProductId(product.id),
      getToolExtras(product.id),
      getToolProfile(product.id),
    ]);
    return { product, owner, comments, extras, profile };
  },
  ['tool-page'],
  { revalidate: 30 },
);
