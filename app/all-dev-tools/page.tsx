import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { ProductType } from '@/type';
// import { shuffleToolsBasedOnDate } from '@/utils/helpers';
import { createBrowserClient } from '@/utils/supabase/browser';
import Pagination from '@/components/ui/Blog/Pagination';

const { title, description, ogImage } = {
  title: 'Explore the best Dev Tools on Dev Hunt',
  description: 'A launchpad for dev tools, built by developers for developers, open source, and fair.',
  ogImage: 'https://devhunt.org/devhuntog.png?v=2',
};

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [ogImage],
    url: 'https://devhunt.org',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
};

export default async function Page({ searchParams }: { searchParams: { page: number } }) {
  const pageCount = Math.max((searchParams.page || 0) - 1, 0);
  const productService = new ProductsService(createBrowserClient());
  const products = await productService.getProducts('votes_count', false, 50, pageCount || 1);

  const numberOfItems = products.count;
  const numberPerPage = 50;
  const numberOfPages = Math.ceil(numberOfItems / numberPerPage);

  return (
    <section className="max-w-4xl mt-20 mx-auto px-4 md:px-8">
      <div>
        <h1 className="text-slate-50 text-3xl font-semibold">All DevTools on Dev Hunt</h1>
      </div>

      <div className="mt-10 mb-12">
        <ul className="mt-3 divide-y divide-slate-800/60">
          {products.data.map((product: ProductType, idx: number) => (
            <ToolCardEffect key={idx} tool={product as ProductType} />
          ))}
        </ul>
      </div>
      <Pagination slug="/all-dev-tools" pageNumber={pageCount || 0} lastPage={numberOfPages} />
    </section>
  );
}
