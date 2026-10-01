import { type Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { allMonths, monthName, monthPath } from '@/utils/roundups';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Best New Dev Tools by Month | DevHunt',
  description: 'Every month since January 2024: the most upvoted developer tools launched on DevHunt, with each week’s winners.',
  metadataBase: new URL('https://devhunt.org'),
  alternates: { canonical: '/best' },
};

// Index of the monthly roundups (app/best/[year]/[month]), grouped by year.
export default function BestByMonth() {
  const byYear = new Map<number, ReturnType<typeof allMonths>>();
  for (const m of allMonths()) byYear.set(m.year, [...(byYear.get(m.year) ?? []), m]);
  return (
    <section className="max-w-4xl mt-10 mb-20 mx-auto px-4 md:px-8">
      <PageHeader eyebrow="Best by month" title="Best new dev tools by month">
        The most upvoted developer tools launched on DevHunt each month, with the weekly winners.
      </PageHeader>
      {Array.from(byYear, ([year, months]) => (
        <div key={year} className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-slate-400">{year}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {months.map(m => (
              <li key={m.month}>
                <Link
                  href={monthPath(m)}
                  className="block rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-slate-600 hover:text-white"
                >
                  {monthName(m)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
