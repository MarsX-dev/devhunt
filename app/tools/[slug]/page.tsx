import { Metadata } from 'next';
import categories from '@/utils/categories';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import CategoryService from '@/utils/supabase/services/categories';
import Page404 from '@/components/ui/Page404/Page404';
import { Product } from '@/utils/supabase/types';
import dynamic from 'next/dynamic';
const ToolCardEffect = dynamic(() => import('@/components/ui/ToolCardEffect/ToolCardEffect'), { ssr: true });
// import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';

const getOriginalSlug = (slug: string) => {
  const getValidSlug = categories.filter(item => slug.replaceAll('-', ' ') == item.name.toLowerCase());
  return getValidSlug[0].name;
};

export async function generateMetadata({ params: { slug } }: { params: { slug: string } }): Promise<Metadata> {
  if (getOriginalSlug(slug))
    return {
      title: `Best ${getOriginalSlug(slug)} Tools`,
      metadataBase: new URL('https://devhunt.org'),
      alternates: {
        canonical: `/tools/${slug}`,
      },
      openGraph: {
        title: `Best ${getOriginalSlug(slug)} Tools`,
      },
      twitter: {
        title: `Best ${getOriginalSlug(slug)} Tools`,
      },
    };
  else
    return {
      title: '404: This page could not be found.',
      description: '',
    };
}

export default async ({ params: { slug } }: { params: { slug: string } }) => {
  const productService = new ProductsService(createBrowserClient());
  const categoryService = new CategoryService(createBrowserClient());

  const categoryName = getOriginalSlug(slug);

  // Fetch the category
  const categories: any = await categoryService.search(categoryName);
  if (categories.length == 0) return <Page404 />;
  const category = categories.find((c: { name: string }) => c.name.toLowerCase() === categoryName.toLowerCase());

  // Fetch the products
  const { data: products } = await productService.getProducts(
    'votes_count',
    false,
    50,
    1,
    category.id,
    productService.EXTENDED_PRODUCT_SELECT_WITH_CATEGORIES,
  );

  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8">
      <>
        <>
          <h1 className="text-xl text-slate-50 font-extrabold">Best {getOriginalSlug(slug)} tools</h1>
          <ul className="mt-10 mb-12 divide-y divide-slate-800/60">
            {products.map((product: Product, idx: number) => (
              <ToolCardEffect key={idx} tool={product as any} />
            ))}
          </ul>
        </>
      </>
    </section>
  );
};
