import ArticleCard from '@/components/ui/Blog/ArticleCard';
import Pagination from '@/components/ui/Blog/Pagination';
import { type Metadata } from 'next';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { getTagArticles } from '@/utils/blog';

async function getPosts(slug: string, page: number) {
  return await getTagArticles(slug, page, 10);
}

function deslugify(str: string) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export async function generateMetadata({
  params: { slug },
  searchParams: { page },
}: {
  params: { slug: string };
  searchParams: { page?: string };
}): Promise<Metadata> {
  const n = Number(page) > 1 ? Number(page) : 1;
  const title = `${deslugify(slug)}${n > 1 ? ` - Page ${n}` : ''} - DevHunt Blog`;
  const description = `Articles tagged "${deslugify(slug)}" on the DevHunt blog: guides and reviews of developer tools.`;
  // Each page of the list is its own canonical, so posts on later pages stay discoverable.
  const path = `/blog/tag/${slug}${n > 1 ? `?page=${n}` : ''}`;
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `https://devhunt.org${path}`,
    },
    twitter: {
      title,
      description,
      // card: 'summary_large_image',
      // images: [],
    },
  };
}

export default async function Tag({
  params: { slug },
  searchParams: { page },
}: {
  params: { slug: string };
  searchParams: { page: number };
}) {
  const pageNumber = Math.max((page || 0) - 1, 0);
  const { total, articles } = await getPosts(slug, pageNumber);
  const posts = articles || [];
  const lastPage = Math.ceil(total / 10);

  return (
    <section className="max-w-3xl mt-20 mx-auto px-4 md:px-8">
      <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
        <Link className="text-orange-500 hover:text-orange-400 duration-200" href="/">
          Home
        </Link>
        <ChevronRightIcon className="w-4 h-4 text-slate-500" />
        <Link className="text-orange-500 hover:text-orange-400 duration-200" href="/blog/">
          Blog
        </Link>
      </div>
      <h1 className="text-4xl my-4 font-semibold text-white">Tag: {slug}</h1>
      <ul>
        {posts.map((article: any) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </ul>
      {lastPage > 1 && <Pagination slug={`/blog/tag/${slug}`} pageNumber={pageNumber} lastPage={lastPage} />}
    </section>
  );
}
