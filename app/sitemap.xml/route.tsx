import ProductsService from '@/utils/supabase/services/products';
import { type Product } from '@/utils/supabase/types';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProfileService from '@/utils/supabase/services/profile';
import categories from '@/utils/categories';

const URL = 'https://devhunt.org';

async function generateSiteMap() {
  const productsService = new ProductsService(createBrowserClient());
  const profiles = await new ProfileService(createBrowserClient()).getProfiles();
  const res = await productsService.getProducts('id', false, 10000);
  const tools = res.data as Product[];
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>${URL}</loc>
    </url>
    <url>
      <loc>${URL}/the-story</loc>
    </url>
    <url>
      <loc>https://devhunt.org/blog</loc>
    </url>
     ${
       tools &&
       tools
         .map(({ slug }) => {
           return `
           <url>
               <loc>${`${URL}/tool/${slug}`}</loc>
           </url>
         `;
         })
         .join('')
     }
     ${categories
       .map(slug => {
         return `
          <url>
              <loc>${`${URL}/tools/${slug.name.toLowerCase().replaceAll(' ', '-')}`}</loc>
          </url>
        `;
       })
       .join('')}
     ${
       profiles &&
       profiles
         .map(({ username }) => {
           return `
          <url>
              <loc>${`${URL}/@${username}`}</loc>
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
