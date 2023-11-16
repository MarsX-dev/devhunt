import ArticleCard from '@/components/ui/Blog/ArticleCard';
import Pagination from '@/components/ui/Blog/Pagination';
import { type Metadata } from 'next';
import { BlogClient } from 'seobot';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'DevHunt Blog';
  const description =
    'The latest on developer tools and services - discover top IDEs, databases, APIs, frameworks, testing tools, deployment systems, and more on the DevHunt blog.';
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: {
      canonical: '/blog',
    },
    openGraph: {
      type: 'website',
      title,
      description,
      // images: [],
      url: 'https://devhunt.org/blog',
    },
    twitter: {
      title,
      description,
      // card: 'summary_large_image',
      // images: [],
    },
  };
}

async function getPosts(page: number) {
  const key = process.env.SEOBOT_API_KEY;
  if (!key) throw Error('SEOBOT_API_KEY enviroment variable must be set');

  const client = new BlogClient(key);
  return await client.getArticles(page, 10);
}

export default async function Blog({ searchParams: { page } }: { searchParams: { page: number } }) {
  const pageNumber = Math.max((page || 0) - 1, 0);
  const { total, articles } = await getPosts(pageNumber);
  const posts = articles || [];
  const lastPage = Math.ceil(total / 10);

  return (
    <section className="max-w-3xl mt-20 mx-auto px-4 md:px-8 tracking-normal">
      <h1 className="text-white text-4xl my-4 font-black">DevHunt's Blog</h1>
      <ul>
        {posts.map((article: any) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </ul>
      {lastPage > 1 && <Pagination slug="/blog" pageNumber={pageNumber} lastPage={lastPage} />}
    </section>
  );
}
