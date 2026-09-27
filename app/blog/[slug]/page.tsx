import { notFound } from 'next/navigation';
import { type Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import HighlightCode from '@/components/ui/HighlightCode';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { getArticle } from '@/utils/blog';

async function getPost(slug: string) {
  return await getArticle(slug);
}

export async function generateMetadata({ params: { slug } }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(slug);
  if (!post) return {};

  const title = post.headline;
  const description = post.metaDescription;
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      images: [post.image],
      url: `https://devhunt.org/blog/${slug}`,
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      images: [post.image],
    },
  };
}

export default async function Article({ params: { slug } }: { params: { slug: string } }) {
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <section className="max-w-3xl mt-20 mx-auto px-4 md:px-8">
      {post.category
        ? (
        <div className="flex flex-wrap items-center gap-2 mb-1 w-full text-sm">
          <Link className="text-orange-500 hover:text-orange-400 duration-200" href="/">
            Home
          </Link>
          <ChevronRightIcon className="w-4 h-4 text-slate-500" />
          <Link className="text-orange-500 hover:text-orange-400 duration-200" href="/blog/">
            Blog
          </Link>
          <ChevronRightIcon className="w-4 h-4 text-slate-500" />
          <Link className="text-orange-500 hover:text-orange-400 duration-200" href={`/blog/category/${post.category.slug}`}>
            {post.category.title}
          </Link>
        </div>
          )
        : null}
      <div className="mt-2 flex flex-wrap gap-2 items-center w-full text-sm text-slate-400">
        <span>
          Published{' '}
          {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {post.readingTime ? <span>{` ⦁ ${post.readingTime}`} min read</span> : null}
      </div>
      {
        post.image?.includes('devhunt.org')
          ? (
        <div className="relative flex justify-center items-center w-full aspect-video mt-2 text-center rounded-xl overflow-hidden">
          <Image src={post.image} alt={post.headline} layout="fill" objectFit="cover" />
        </div>
            )
          : null
      }
      <div
        className="prose prose-a:text-orange-500 hover:prose-a:text-orange-400 prose-invert mt-8 text-[15px] leading-7"
        dangerouslySetInnerHTML={{ __html: post.html }}
      ></div>
      <div className="flex flex-wrap gap-2 justify-start w-full">
        {(post.tags || []).map((t: any, ix: number) => (
          <a
            key={ix}
            href={`/blog/tag/${t.slug}`}
            className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-xs text-slate-400 font-semibold"
          >
            {t.title}
          </a>
        ))}
      </div>
      {post.relatedPosts?.length
        ? (
        <div className="mt-8 prose prose-a:no-underline hover:prose-a:underline hover:prose-a:text-orange-500 prose-invert text-[15px] leading-7">
          <h2>Related posts</h2>
          <ul>
            {post.relatedPosts.map((p: any, ix: number) => (
              <li key={ix}>
                <Link className="duration-200" href={`/blog/${p.slug}`}>
                  {p.headline}
                </Link>
              </li>
            ))}
          </ul>
        </div>
          )
        : null}
      <HighlightCode />
    </section>
  );
}
