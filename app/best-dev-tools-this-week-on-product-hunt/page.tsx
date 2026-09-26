import axios from 'axios';
import ToolName from '@/components/ui/ToolCard/Tool.Name';
import Title from '@/components/ui/ToolCard/Tool.Title';
import ToolFooter from '@/components/ui/ToolCard/Tool.Footer';
import Image from 'next/image';
import ProductHuntCard from '@/components/ui/ProductHuntCard';

type Product = {
  node: {
    id: string;
    name: string;
    description: string;
    slug: string;
    tagline: string;
    votesCount: number;
    thumbnail: {
      url: string;
    };
    productLinks: {
      url: string;
    };
    website: string;
  };
};

export const metadata = {
  title: 'Best dev tools this week on Product Hunt - Dev Hunt',
  metadataBase: new URL('https://devhunt.org'),
  alternates: {
    canonical: '/best-dev-tools-this-week-on-product-hunt',
  },
};

export default async () => {
  const origin = process.env.NODE_ENV == 'development' ? 'http://localhost:3000' : 'https://devhunt.org';
  const {
    data: { posts },
  } = await axios.get(`${origin}/api/ph-dev-tools`).catch(() => ({ data: { posts: [] } }));

  return (
    <section className="max-w-4xl mt-20 mx-auto px-4 md:px-8">
      <div>
        <h1 className="text-slate-50 text-3xl font-semibold">Best dev tools this week on Product Hunt</h1>
      </div>
      <ul className="mt-10 mb-12 divide-y divide-slate-800/60">
        {posts?.map((tool: Product, idx: number) => (
          <li key={idx} className="py-3">
            <ProductHuntCard href={tool.node.website}>
              <div className="w-full flex items-center gap-x-4">
                <Image
                  src={tool.node.thumbnail.url}
                  alt={tool.node.name}
                  width={64}
                  height={64}
                  className="rounded-full object-cover flex-none"
                />
                <div className="w-full space-y-1">
                  <ToolName href={tool.node.website}>{tool.node.name}</ToolName>
                  <Title className="line-clamp-2">{tool.node.tagline}</Title>
                  <ToolFooter>
                    {/* <Tags items={[tool.product_pricing_types?.title ?? 'Free', ...(tool.product_categories || []).map(c => c.name)]} /> */}
                  </ToolFooter>
                </div>
              </div>
              <div className="px-4 py-1 text-center active:scale-[1.5] duration-200 rounded-md border bg-[linear-gradient(180deg,_#252321_0%,_rgba(37,_35,_33,_0.00)_100%)] border-slate-700 text-orange-300">
                <span className="text-sm pointer-events-none">#{idx + 1}</span>
              </div>
            </ProductHuntCard>
          </li>
        ))}
      </ul>
    </section>
  );
};
