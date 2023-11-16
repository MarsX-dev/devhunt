import ArticleCard from '@/components/ui/Blog/ArticleCard';
import Pagination from '@/components/ui/Blog/Pagination';
import { type Metadata } from 'next';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { BlogClient } from 'seobot';

async function getPosts(slug: string, page: number) {
  const key = process.env.SEOBOT_API_KEY;
  if (!key) throw Error('SEOBOT_API_KEY enviroment variable must be set');

  const client = new BlogClient(key);
  return await client.getCategoryArticles(slug, page, 10);
}

function deslugify(str: string) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export async function generateMetadata({ params: { slug } }: { params: { slug: string } }): Promise<Metadata> {
  const title = `${deslugify(slug)} - DevHunt Blog`;
  return {
    title,
    metadataBase: new URL('https://devhunt.org'),
    alternates: {
      canonical: `/blog/category/${slug}`,
    },
    openGraph: {
      type: 'article',
      title,
      // description: '',
      // images: [],
      url: `https://devhunt.org/blog/category/${slug}`,
    },
    twitter: {
      title,
      // description: '',
      // card: 'summary_large_image',
      // images: [],
    },
  };
}

export default async function Category({
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
      <div className="flex flex-wrap items-center gap-2 w-full text-sm mb-4">
        <a className="text-orange-500 hover:text-orange-400 duration-200" href="/">
          Home
        </a>
        <ChevronRightIcon className="w-4 h-4 text-slate-500" />
        <Link className="text-orange-500 hover:text-orange-400 duration-200" href="/blog/">
          Blog
        </Link>
      </div>
      <h1 className="text-4xl my-4 font-semibold text-white">Category: {slug}</h1>
      <ul>
        {posts.map((article: any) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </ul>
      {lastPage > 1 && <Pagination slug={`/blog/category/${slug}`} pageNumber={pageNumber} lastPage={lastPage} />}
    </section>
  );
}
