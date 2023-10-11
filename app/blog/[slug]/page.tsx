import '../../blog.css';
import Page404 from '@/components/ui/Page404';
import Link from 'next/link';

async function getPost(slug: string) {
  const key = process.env.SEOBOT_API_KEY;
  const host = process.env.WEBSITE_HOST;
  if (!key) throw Error('SEOBOT_API_KEY enviroment variable must be set');
  if (!host) throw Error('WEBSITE_HOST enviroment variable must be set');
  
  try {
    const res = await fetch(`https://app.seobotai.com/api/article?key=${key}&host=${host}&slug=${slug}`);
    const result = await res.json();
    return result?.data?.article;
  } catch {
    return null;
  }
}

export default async function Article({ params: { slug } }: { params: { slug: string } }) {
  const post = await getPost(slug);
  if (!post) return <Page404 />;

  return (
    <section className="article max-w-2xl lg:mt-4 mx-auto px-4 md:px-8 dark:text-white">
      {post.category
        ? (
        <div className="flex flex-wrap items-center gap-2 mb-1 w-full dark:text-slate-400 text-sm">
          <a href="/">Home</a>
          <svg width="12" height="12" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="currentColor"
              d="M338.752 104.704a64 64 0 0 0 0 90.496l316.8 316.8l-316.8 316.8a64 64 0 0 0 90.496 90.496l362.048-362.048a64 64 0 0 0 0-90.496L429.248 104.704a64 64 0 0 0-90.496 0z"
            />
          </svg>
          <Link href="/blog/">Blog</Link>
          <svg width="12" height="12" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="currentColor"
              d="M338.752 104.704a64 64 0 0 0 0 90.496l316.8 316.8l-316.8 316.8a64 64 0 0 0 90.496 90.496l362.048-362.048a64 64 0 0 0 0-90.496L429.248 104.704a64 64 0 0 0-90.496 0z"
            />
          </svg>
          <Link href={`/blog/category/${post.category.slug}`}>{post.category.title}</Link>
        </div>
          )
        : null}
      <div className="flex flex-wrap gap-2 items-center w-full text-sm dark:text-slate-400">
        <span>
          Published{' '}
          {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {post.readingTime ? <span>{` ⦁ ${post.readingTime}`} min read</span> : null}
      </div>
      <div dangerouslySetInnerHTML={{ __html: post.html }}></div>
      <div className="flex flex-wrap gap-2 justify-start w-full">
          {(post.tags || []).map((t: any, ix: number) => (
            <a key={ix} href={`/blog/tag/${t.slug}`} className="dark:bg-slate-700 px-3 rounded text-sm">
              {t.title}
            </a>
          ))}
        </div>
      {post.relatedPosts?.length
        ? (
          <div>
            <h2>Related posts</h2>
            <ul>
              {post.relatedPosts.map((p: any, ix: number) => (
                <li key={ix}>
                  <a href={`/blog/${p.slug}`}>{p.headline}</a>
                </li>
              ))}
            </ul>
          </div>
          )
        : null}
    </section>
  );
}
