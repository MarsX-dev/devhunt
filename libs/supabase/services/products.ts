import { createServerClient } from '@/libs/supabase/server';


function getProducts(){
  const supabase = createServerClient();

  return supabase
    .from('products')
    .select("*, product_pricing_types(*), product_categories(name)");
}

export async function getTopProducts(): Promise<TopProductsResponseSuccess> {
  const { data: products, error } = await getProducts();

  if(error) {
    console.error(error);
    return [];
  }

  return products;
}

export type TopProductsResponse = Awaited<ReturnType<typeof getProducts>>
export type TopProductsResponseSuccess = TopProductsResponse['data']
