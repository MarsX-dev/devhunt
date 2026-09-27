import ArticleCard from '@/components/ui/Blog/ArticleCard';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Blog/Pagination';
import { type Metadata } from 'next';
import { getArticles } from '@/utils/blog';

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
  return await getArticles(page, 10);
}

export default async function Blog({ searchParams: { page } }: { searchParams: { page: number } }) {
  const pageNumber = Math.max((page || 0) - 1, 0);
  const { total, articles } = await getPosts(pageNumber);
  const posts = articles || [];
  const lastPage = Math.ceil(total / 10);

  return (
    <section className="max-w-3xl mt-10 mb-24 mx-auto px-4 md:px-8 tracking-normal">
      <PageHeader eyebrow="Blog" title="Notes on dev tools">
        Lists, comparisons and guides for developers and makers.
      </PageHeader>
      <ul className="mt-4">
        {posts.map((article: any) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </ul>
      {lastPage > 1 && <Pagination slug="/blog" pageNumber={pageNumber} lastPage={lastPage} />}
    </section>
  );
}
