import axios from 'axios';
import PageHeader from '@/components/ui/PageHeader';
import Image from 'next/image';

// Served from the CDN and refreshed hourly.
export const revalidate = 3600;

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
    <section className="max-w-4xl mt-10 mb-24 mx-auto px-4 md:px-8">
      <PageHeader eyebrow="Product Hunt" title="Best dev tools this week on Product Hunt">
        The top developer tools launching on Product Hunt this week, in one list.
      </PageHeader>
      <ol className="mt-10">
        {posts?.map((tool: Product, idx: number) => (
          <li key={idx}>
            <a
              href={tool.node.website}
              target="_blank"
              rel="nofollow noopener"
              className="-mx-2 flex items-center gap-x-3 rounded-lg px-2 py-2.5 duration-150 hover:bg-slate-800/50"
            >
              <span className={`w-7 flex-none text-right font-mono text-xs tabular-nums ${idx < 3 ? 'text-orange-500' : 'text-slate-600'}`}>{idx + 1}</span>
              <Image src={tool.node.thumbnail.url} alt={tool.node.name} width={32} height={32} className="h-8 w-8 flex-none rounded-lg object-cover ring-1 ring-slate-800" />
              <span className="min-w-0 flex-1 truncate text-sm">
                <span className="font-medium text-slate-100">{tool.node.name}</span>
                <span className="text-slate-500"> · {tool.node.tagline}</span>
              </span>
              <span className="flex-none text-xs text-slate-500">Visit ↗</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
};
