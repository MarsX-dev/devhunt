import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import ToolRow from '@/components/ui/ToolRow';
import { categoryPath } from '@/utils/sitemap';
import { allMonths, getRoundup, isCurrentMonth, monthName, monthPath, parseMonth, type Month } from '@/utils/roundups';

// /best/{year}/{month}: the month's best new dev tools (utils/roundups.ts). Cached at the CDN; the data is
// cached for a day (an hour for the current month).
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

interface Params { params: { year: string; month: string } }

const label = (m: Month) => (isCurrentMonth(m) ? `${monthName(m)} so far` : monthName(m));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const m = parseMonth(params.year, params.month);
  if (!m) return { title: 'Page not found - Dev Hunt' };
  const r = await getRoundup(m);
  const title = `Best New Dev Tools of ${monthName(m)} | DevHunt`;
  const description = `The ${Math.min(r.top.length, 30)} most upvoted of ${r.total.toLocaleString(
    'en-US',
  )} developer tools launched on DevHunt in ${monthName(m)}${
    r.top.length
      ? `, led by ${r.top
          .slice(0, 3)
          .map(t => t.name)
          .join(', ')}`
      : ''
  }.`.slice(0, 160);
  const image = { url: `https://devhunt.org/api/og${monthPath(m)}`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: { canonical: monthPath(m) },
    // A month with almost nothing launched is a thin page.
    robots: r.total < 10 ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: `https://devhunt.org${monthPath(m)}`, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function MonthRoundup({ params }: Params) {
  const m = parseMonth(params.year, params.month);
  if (!m) notFound();
  const r = await getRoundup(m);
  const months = allMonths();
  const idx = months.findIndex(x => x.year === m.year && x.month === m.month);
  const newer = idx > 0 ? months[idx - 1] : null;
  const older = idx < months.length - 1 ? months[idx + 1] : null;
  const url = `https://devhunt.org${monthPath(m)}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'DevHunt', item: 'https://devhunt.org/' },
          { '@type': 'ListItem', position: 2, name: 'Best by month', item: 'https://devhunt.org/best' },
          { '@type': 'ListItem', position: 3, name: monthName(m), item: url },
        ],
      },
      {
        '@type': 'ItemList',
        name: `Best new dev tools of ${monthName(m)}`,
        url,
        itemListElement: r.top.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://devhunt.org/tool/${t.slug}`,
          name: t.name,
        })),
      },
    ],
  };

  return (
    <section className="max-w-4xl mt-10 mb-20 mx-auto px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <PageHeader eyebrow="Best by month" title={`Best new dev tools of ${label(m)}`}>
        {r.total.toLocaleString('en-US')} developer tools launched on DevHunt in {monthName(m)}. These are the {Math.min(r.top.length, 30)}{' '}
        the community upvoted most
        {r.winners.length ? `, plus the ${r.winners.length} weekly winners` : ''}.
      </PageHeader>

      {r.winners.length > 0 && (
        <div className="mt-10">
          <SectionLabel title="Weekly winners" hint="top 3 of their launch week" />
          <ul className="mt-2 flex flex-wrap gap-2">
            {r.winners.map(w => (
              <li key={w.tool.id}>
                <Link
                  href={`/tool/${w.tool.slug}`}
                  className="inline-flex items-center gap-x-2 rounded-full border border-slate-800 px-3 py-1 text-sm text-slate-300 hover:border-slate-600 hover:text-white"
                >
                  <span className="font-mono text-xs text-orange-400">#{w.rank}</span>
                  {w.tool.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <SectionLabel title="Most upvoted launches" />
        <ol className="mt-2">
          {r.top.map((tool, i) => (
            <ToolRow key={tool.id} tool={tool} rank={i + 1} showDate revealIndex={i} />
          ))}
        </ol>
      </div>

      {r.categories.length > 0 && (
        <div className="mt-10">
          <SectionLabel title="Top categories this month" />
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {r.categories.map(c => (
              <li key={c.name}>
                <Link
                  href={categoryPath(c.name)}
                  className="inline-flex gap-x-1.5 rounded-full border border-slate-800 px-3 py-1 text-slate-300 hover:border-slate-600 hover:text-white"
                >
                  {c.name} <span className="text-slate-500">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <nav className="mt-12 flex items-center justify-between text-sm text-slate-400" aria-label="Other months">
        {older
          ? (
          <Link href={monthPath(older)} className="hover:text-white">
            ← {monthName(older)}
          </Link>
            )
          : (
          <span />
            )}
        <Link href="/best" className="hover:text-white">
          All months
        </Link>
        {newer
          ? (
          <Link href={monthPath(newer)} className="hover:text-white">
            {monthName(newer)} →
          </Link>
            )
          : (
          <span />
            )}
      </nav>
    </section>
  );
}
