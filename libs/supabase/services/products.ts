import { createServerClient } from '@/libs/supabase/server';


function getProducts(sortBy: string = 'votes_counter', ascending: boolean = false) {
  const supabase = createServerClient();

  // there is error in types? foreignTable is required for order options, while it's not
  //@ts-ignore
  return supabase
    .from('products')
    .select("*, product_pricing_types(*), product_categories(name)")
    .order(sortBy, { ascending });
}

export async function getTopProducts(sortBy: string, ascending: boolean): Promise<TopProductsResponseSuccess> {
  const { data: products, error } = await getProducts(sortBy, ascending);

  if (error) {
    console.error(error);
    return [];
  }

  return products;
}

export type TopProductsResponse = Awaited<ReturnType<typeof getProducts>>
export type TopProductsResponseSuccess = TopProductsResponse['data']
