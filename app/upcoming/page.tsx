import { Fragment } from 'react';
import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { ProductType } from '@/type';
// import { shuffleToolsBasedOnDate } from '@/utils/helpers';
import { createBrowserClient } from '@/utils/supabase/browser';
import { toToolCardProps } from '@/utils/toolCard';
import { weekKey } from '@/utils/launchWeeks';

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
    <section className="max-w-4xl mt-20 mx-auto px-4 md:px-8">
      <div>
        <h1 className="text-slate-50 text-3xl font-semibold">The upcoming tools</h1>
        <p className="text-slate-300 mt-3">Browse the upcoming tools, and be in update with the next.</p>
      </div>

      <div className="mt-10 mb-12">
        {launchWeeks.map((group, weekIdx) => (
          <Fragment key={group.startDate.toISOString()}>
            <div id={`week-${weekIdx + 1}`} className="mt-3 text-slate-400 text-sm scroll-mt-24" data-week={weekKey(group.startDate)}>
              {group.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
            </div>
            <ul className="mt-3 divide-y divide-slate-800/60">
              {group.products.map((product, idx) => (
                <ToolCardEffect key={product.id ?? idx} tool={toToolCardProps(product)} />
              ))}
            </ul>
          </Fragment>
        ))}
        {!!laterCount && weeksToShow < MAX_WEEKS && (
          <div className="mt-10 text-center">
            {/* A plain link (full load): the client router kept showing the old weeks after the URL changed. The anchor
                opens the page at the first newly added week. */}
            <a
              href={`/upcoming?weeks=${weeksToShow + WEEKS_PER_PAGE}#week-${weeksToShow + 1}`}
              className="inline-block rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 duration-150"
            >
              Show more ({laterCount.toLocaleString('en-US')} tools scheduled)
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
