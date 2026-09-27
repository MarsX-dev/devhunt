import { Metadata } from 'next';
import categories from '@/utils/categories';
import PageHeader from '@/components/ui/PageHeader';

const categoryDescription = (name?: string) => categories.find(c => c.name === name)?.description ?? '';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import CategoryService from '@/utils/supabase/services/categories';
import { notFound } from 'next/navigation';
import { Product } from '@/utils/supabase/types';
import dynamic from 'next/dynamic';
import MonitizorAdCards from "@/components/ui/MonitizerAdCards";
import { toToolCardProps } from '@/utils/toolCard';
const ToolCardEffect = dynamic(() => import('@/components/ui/ToolCardEffect/ToolCardEffect'), { ssr: true });
// import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';

const getOriginalSlug = (slug: string) => {
  const getValidSlug = categories.filter(item => slug.replaceAll('-', ' ') == item.name.toLowerCase());
  return getValidSlug[0]?.name;
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
  if (!categoryName) notFound();

  // Fetch the category
  const categories: any = await categoryService.search(categoryName);
  const category = categories.find((c: { name: string }) => c.name.toLowerCase() === categoryName.toLowerCase());
  if (!category) notFound();

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
    <section className="max-w-4xl mt-10 mx-auto px-4 md:px-8">
      <PageHeader eyebrow="Category" title={`Best ${getOriginalSlug(slug)} tools`}>
        {categoryDescription(getOriginalSlug(slug))} Ranked by upvotes from the community.
      </PageHeader>
      <MonitizorAdCards />
      <ol className="mt-12 mb-12 divide-y divide-slate-800/70">
        {products.map((product: Product, idx: number) => (
          <ToolCardEffect key={product.id ?? idx} tool={toToolCardProps(product)} rank={idx + 1} revealIndex={idx} />
        ))}
      </ol>
    </section>
  );
};
