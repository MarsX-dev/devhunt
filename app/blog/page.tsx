import Link from 'next/link';

async function getPosts() {
  const key = process.env.SEOBOT_API_KEY;
  const host = process.env.WEBSITE_HOST;
  try {
    const res = await fetch(`https://app.seobotai.com/api/articles?key=${key}&host=${host}&page=0&limit=100`);
    const result = await res.json();
    return result?.data?.articles || [];
  } catch {
    return [];
  }
}

export default async function Blog() {
  const posts = await getPosts();
  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8 dark:text-white">
      <h1 className='text-4xl mb-4 font-black'>DevHunt's Blog</h1>
      <ul>
        {posts.map((i: any) => (
          <li key={i.id} className="border-b border-gray-200 dark:border-slate-700 py-6">
            <div className="flex flex-wrap gap-2 items-center w-full text-sm dark:text-slate-400">
              <span>
                Published{' '}
                {new Date(i.publishedAt || i.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {i.readingTime ? <span>{` ⦁ ${i.readingTime}`} min read</span> : null}
            </div>
            <Link href={`/blog/${i.slug}`} className="block mt-1 mb-3 text-2xl font-bold">
              {i.headline}
            </Link>
            <div className="mb-3 w-full dark:text-slate-400">{i.metaDescription}</div>
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(i.tags || []).splice(0, 3).map((t: any, ix: number) => (
                  <a key={ix} href={`/blog/tag/${t.slug}`} className="bg-slate-700 px-3 rounded">
                    {t.title}
                  </a>
                ))}
              </div>
              <Link href={`/blog/${i.slug}`} className="self-end font-bold">
                Read More →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
