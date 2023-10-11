import Link from 'next/link';

async function getPosts(slug: string, page: number) {
  const key = process.env.SEOBOT_API_KEY;
  const host = process.env.WEBSITE_HOST;
  if (!key) throw Error('SEOBOT_API_KEY enviroment variable must be set');
  if (!host) throw Error('WEBSITE_HOST enviroment variable must be set');
  
  try {
    const res = await fetch(`https://app.seobotai.com/api/articles?key=${key}&host=${host}&page=${page}&limit=10&tagSlug=${slug}`);
    const result = await res.json();
    return result?.data;
  } catch {
    return { total: 0, articles: [] };
  }
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
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8 dark:text-white">
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
      <h1 className="text-4xl mb-4 font-black">Tag: {slug}</h1>
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
      {lastPage > 1
        ? (
        <div className="flex mt-6 items-center justify-center">
          <a
            className={`border rounded-md px-2 py-1 w-[90px] text-center ${pageNumber ? '' : 'pointer-events-none opacity-30'}`}
            href={pageNumber ? `/blog/tag/${slug}?page=${pageNumber}` : '#'}
          >
            ← Prev
          </a>
          <div className="px-6 font-bold">
            {pageNumber + 1} / {lastPage}
          </div>
          <a
            className={`border rounded-md px-2 py-1 w-[90px] text-center ${
              pageNumber >= lastPage - 1 ? 'pointer-events-none opacity-30' : ''
            }`}
            href={pageNumber >= lastPage - 1 ? '#' : `/blog/tag/${slug}?page=${pageNumber + 2}`}
          >
            Next →
          </a>
        </div>
          )
        : null}
    </section>
  );
}
