import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { ProductType } from '@/type';
// import { shuffleToolsBasedOnDate } from '@/utils/helpers';
import { createBrowserClient } from '@/utils/supabase/browser';
import Pagination from '@/components/ui/Blog/Pagination';
import PageHeader from '@/components/ui/PageHeader';
import { getSiteStats } from '@/utils/siteStats';
import { toToolCardProps } from '@/utils/toolCard';

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
  const products = await productService.getProducts('votes_count', false, 50, pageCount + 1); // 1-based (was `pageCount || 1`: page 2 repeated page 1)

  const numberOfItems = products.count;
  const stats = await getSiteStats(); // products.count is capped at 1,000
  const numberPerPage = 50;
  const numberOfPages = Math.ceil(numberOfItems / numberPerPage);

  return (
    <section className="max-w-4xl mt-10 mx-auto px-4 md:px-8">
      <PageHeader eyebrow="All-time leaderboard" title="All dev tools on DevHunt">
        {(stats?.tools_launched ?? numberOfItems).toLocaleString('en-US')} tools launched, ranked by upvotes from the community.
      </PageHeader>

      <div className="mt-12 mb-12">
        <ol className="divide-y divide-slate-800/70">
          {products.data.map((product: ProductType, idx: number) => (
            <ToolCardEffect key={product.id ?? idx} tool={toToolCardProps(product)} rank={pageCount * 50 + idx + 1} revealIndex={idx} />
          ))}
        </ol>
      </div>
      <Pagination slug="/all-dev-tools" pageNumber={pageCount || 0} lastPage={numberOfPages} />
    </section>
  );
}
