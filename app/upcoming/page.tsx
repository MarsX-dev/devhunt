import Link from 'next/link';
import { Fragment } from 'react';
import ProductsService from '@/utils/supabase/services/products';
import ToolRow from '@/components/ui/ToolRow';
import { ProductType } from '@/type';
// import { shuffleToolsBasedOnDate } from '@/utils/helpers';
import { createBrowserClient } from '@/utils/supabase/browser';
import { toToolRow } from '@/utils/toolRow';
import { weekKey } from '@/utils/launchWeeks';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';

const { title, description, ogImage } = {
  title: 'Dev Hunt – The best new Dev Tools every day.',
  description: 'A launchpad for dev tools, built by developers for developers, open source, and fair.',
  ogImage: 'https://devhunt.org/devhuntog.png?v=2',
};

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [ogImage],
    url: 'https://devhunt.org',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
};

function getDate(weekStartDay: number): Date {
  let today = new Date();
  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const dow = jan1.getDay();
  // Find first startDay on or after Jan 1
  const offset = (weekStartDay - dow + 7) % 7;
  const firstWeekStart = new Date(jan1.getTime() + offset * 86400000);
  if (today < firstWeekStart) {
    today = new Date(year - 1, 11, 31, 23, 59, 59); // Use last day of previous year
  }

  return today;
}

// Weeks shown initially and added per "Show more" click.
const WEEKS_PER_PAGE = 4;
const MAX_WEEKS = 52;

export default async function Home({ searchParams }: { searchParams: { weeks?: string } }) {
  const weeksToShow = Math.min(Math.max(Number(searchParams.weeks) || WEEKS_PER_PAGE, WEEKS_PER_PAGE), MAX_WEEKS);
  const weekStartDay = 2;
  const today = getDate(weekStartDay);
  const supabase = createBrowserClient();
  const productService = new ProductsService(supabase);
  const week = await productService.getWeekNumber(today, 2);
  const launchWeeks = await productService.getNextLaunchWeeks(today.getFullYear(), 2, week, weeksToShow);

  // How many tools are scheduled after the last week shown (for the "Show more" button).
  const lastShownEnd = launchWeeks.length ? launchWeeks[launchWeeks.length - 1].endDate : null;
  const { count: laterCount } = lastShownEnd
    ? await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('deleted', false)
        .gt('launch_start', lastShownEnd.toISOString())
    : { count: 0 };

  return (
    <section className="max-w-4xl mt-10 mx-auto px-4 md:px-8">
      <PageHeader eyebrow="Coming up" title="The next dev tools to launch">
        New launches go live every Tuesday. Here&apos;s who&apos;s next in line.{' '}
        <Link href="/account/tools/new" className="text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-slate-50">
          Launch yours
        </Link>
      </PageHeader>

      <div className="mt-10 mb-12">
        {launchWeeks.map((group, weekIdx) => (
          <Fragment key={group.startDate.toISOString()}>
            <div id={`week-${weekIdx + 1}`} className={`scroll-mt-24 ${weekIdx ? 'mt-14' : ''}`} data-week={weekKey(group.startDate)}>
              <SectionLabel
                title={`Week of ${group.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}`}
                hint={`${group.products.length} ${group.products.length === 1 ? 'tool' : 'tools'}${weekIdx === 0 ? ' · next Tuesday' : ''}`}
              />
            </div>
            <ol className="mt-2">
              {group.products.map((product, idx) => (
                <ToolRow key={product.id ?? idx} tool={toToolRow(product)} revealIndex={idx} />
              ))}
            </ol>
          </Fragment>
        ))}
        {!!laterCount && weeksToShow < MAX_WEEKS && (
          <div className="mt-10 text-center">
            {/* A plain link (full load): the client router kept showing the old weeks after the URL changed. The anchor
                opens the page at the first newly added week. */}
            <a
              href={`/upcoming?weeks=${weeksToShow + WEEKS_PER_PAGE}#week-${weeksToShow + 1}`}
              className="inline-block rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-300 duration-150 hover:border-slate-600 hover:text-slate-50"
            >
              Show more ({laterCount.toLocaleString('en-US')} tools scheduled)
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
