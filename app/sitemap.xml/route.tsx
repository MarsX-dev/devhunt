import ProductsService from '@/utils/supabase/services/products';
import { Product } from '@/utils/supabase/types';
import { createBrowserClient } from '@/utils/supabase/browser';

async function generateSiteMap() {
  const productsService = new ProductsService(createBrowserClient());
  const res = await productsService.getProducts();
  const tools = res.data as Product[];
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://devhunt.org</loc>
     </url>
     ${
       tools &&
       tools
         .map(({ slug }) => {
           return `
           <url>
               <loc>${`https://devhunt.org/tool/${slug}`}</loc>
           </url>
         `;
         })
         .join('')
     }
   </urlset>
 `;
}

export async function GET() {
  const body = await generateSiteMap();

  return new Response(body, {
    status: 200,
    headers: {
      'Cache-control': 'public, s-maxage=86400, stale-while-revalidate',
      'content-type': 'application/xml',
    },
  });
}
