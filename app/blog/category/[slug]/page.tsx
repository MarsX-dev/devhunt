import ArticleCard from '@/components/ui/Blog/ArticleCard';
import Pagination from '@/components/ui/Blog/Pagination';
import { type Metadata } from 'next';
import Link from 'next/link';

async function getPosts(slug: string, page: number) {
  const key = process.env.SEOBOT_API_KEY;
  if (!key) throw Error('SEOBOT_API_KEY enviroment variable must be set');

  try {
    const res = await fetch(`https://app.seobotai.com/api/articles?key=${key}&page=${page}&limit=10&categorySlug=${slug}`, { cache: 'no-store' });
    const result = await res.json();
    return result?.data;
  } catch {
    return { total: 0, articles: [] };
  }
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
    <section className="max-w-3xl my-8 lg:mt-10 mx-auto px-4 md:px-8 dark:text-white">
      <div className="flex flex-wrap items-center gap-2 mb-1 w-full dark:text-slate-400 text-sm mb-4">
        <a href="/" className='text-orange-500'>Home</a>
        <svg width="12" height="12" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M338.752 104.704a64 64 0 0 0 0 90.496l316.8 316.8l-316.8 316.8a64 64 0 0 0 90.496 90.496l362.048-362.048a64 64 0 0 0 0-90.496L429.248 104.704a64 64 0 0 0-90.496 0z"
          />
        </svg>
        <Link href="/blog/" className='text-orange-500'>Blog</Link>
      </div>
      <h1 className='text-4xl my-4 font-black'>Category: {slug}</h1>
      <ul>
        {posts.map((article: any) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </ul>
      {lastPage > 1 && <Pagination slug={`/blog/category/${slug}`} pageNumber={pageNumber} lastPage={lastPage} />}
    </section>
  );
}
