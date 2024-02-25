import axios from 'axios';
import ToolName from '@/components/ui/ToolCard/Tool.Name';
import Title from '@/components/ui/ToolCard/Tool.Title';
import ToolFooter from '@/components/ui/ToolCard/Tool.Footer';
import Image from 'next/image';
import ProductHuntCard from '@/components/ui/ProductHuntCard';
import request from 'request';

function extractHostAndPath(url: string): { host: string; path: string } {
  const regex = /^(?:https?:\/\/)?([^\/?#]+)(\/[^?#]*)?/;
  const matches = url.match(regex);

  if (matches && matches.length >= 2) {
    const host = matches[1];
    const path = matches[2] || '/'; // Default to '/' if path is not provided
    return { host, path };
  } else {
    throw new Error('Invalid URL format');
  }
}

function extractLink(url: string) {
  // Regular expression to match URLs with "www." or without any protocol
  const regex = /^(?:https?:\/\/)?(?:www\.)?(.*)/;

  // Extract the domain from the URL using regex
  const matches = url.match(regex);

  // If matches found, construct the link with "https://" prefix
  if (matches && matches.length > 1) {
    const domain = matches[1];
    return `https://${domain}`;
  }

  // If no matches found, return the original URL
  return url;
}

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
  const origin = process.env.NODE_ENV == 'development' ? 'http://localhost:3001' : 'https://devhunt.org';
  const {
    data: { posts },
  } = await axios.get(`${origin}/api/ph-dev-tools`);

  // Create an array to store all the promises for the requests
  const requests = posts.map((item: Product) => {
    // Return a promise for each request
    return new Promise((resolve, reject) => {
      // Perform the request asynchronously
      request({ url: item.node.website, followRedirect: false }, function (err, res, body) {
        if (err) {
          reject(err);
        } else {
          resolve(extractLink(extractHostAndPath(res.headers.location as string).host));
        }
      });
    });
  });

  // Wait for all promises to resolve
  const websites = (await Promise.all(requests)) || [];

  return (
    <section className="max-w-4xl mt-20 mx-auto px-4 md:px-8">
      <div>
        <h1 className="text-slate-50 text-3xl font-semibold">Best dev tools this week on Product Hunt</h1>
      </div>
      <ul className="mt-10 mb-12 divide-y divide-slate-800/60">
        {posts?.map((tool: Product, idx: number) => (
          <li key={idx} className="py-3">
            <ProductHuntCard href={websites[idx] ? `${websites[idx]}/?ref=devhunt` : tool.node.website}>
              <div className="w-full flex items-center gap-x-4">
                <Image
                  src={tool.node.thumbnail.url}
                  alt={tool.node.name}
                  width={64}
                  height={64}
                  className="rounded-full object-cover flex-none"
                />
                <div className="w-full space-y-1">
                  <ToolName href={websites[idx] ? websites[idx] : tool.node.website}>{tool.node.name}</ToolName>
                  <Title className="line-clamp-2">{tool.node.tagline}</Title>
                  <ToolFooter>
                    {/* <Tags items={[tool.product_pricing_types?.title ?? 'Free', ...(tool.product_categories || []).map(c => c.name)]} /> */}
                  </ToolFooter>
                </div>
              </div>
              <div className="px-4 py-1 text-center active:scale-[1.5] duration-200 rounded-md border bg-[linear-gradient(180deg,_#1E293B_0%,_rgba(30,_41,_59,_0.00)_100%)] border-slate-700 text-orange-300">
                <span className="text-sm pointer-events-none">#{idx + 1}</span>
              </div>
            </ProductHuntCard>
          </li>
        ))}
      </ul>
    </section>
  );
};
