import { MetadataRoute } from 'next';
import ProductsService from '@/utils/supabase/services/products';
import { createServerClient } from '@/utils/supabase/server';
import { Product } from '@/utils/supabase/types';

export default function sitemap(): MetadataRoute.Sitemap {
  let tools: Product[] = [];
  new ProductsService(createServerClient()).getProducts().then(res => {
    tools = res.data as Product[];
  });

  return tools.map(item => {
    return {
      url: `https://devhunt.org/tool/${item.slug}`,
      lastModified: new Date(item.updated_at),
    };
  });
}
