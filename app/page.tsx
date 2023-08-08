import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { ProductType } from '@/type';
// import { shuffleToolsBasedOnDate } from '@/utils/helpers';
import { createBrowserClient } from '@/utils/supabase/browser';
import moment from 'moment';

const { title, description, ogImage } = {
  title: 'Dev Hunt – The best new Dev Tools every day.',
  description: 'A launchpad for dev tools, built by developers for developers, open source, and fair.',
  ogImage: 'https://devhunt.org/devhuntog.png?v=2',
};

export const revalidate = 60;

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

function RenderDatePart({ number, letter }) {
  return (
    <div className="rounded-md p-[1px] overflow-hidden bg-gradient-to-b from-[#514b6130] to-[#514b6100]">
      <div className="py-2 px-3 rounded-md w-11 leading-4 flex items-center justify-center bg-gradient-to-b from-[#51269c40] to-[#DBB8BF10] backdrop-blur-md">
        <span className="m-0">{number}</span>
        <span>{letter}</span>
      </div>
    </div>
  );
}

function RenderCountdown() {
  const now = moment();
  let nextMondayNight;

  // Set hours to 24 (end of day), minutes and seconds to zero
  if (now.day() === 0 || (now.day() === 1 && now.hour() < 24)) { // If today is Sunday or Monday but before midnight
      nextMondayNight = now.clone().add(1, 'days').hour(24).minute(0).second(0);
  } else {
      nextMondayNight = now.clone().startOf('isoWeek').add(1, 'week').day('Monday').endOf('d');
  }
  const diff = moment.duration(nextMondayNight.diff(now));

  const days = Math.floor(diff.asHours() / 24);
  const hours = diff.hours();
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  return (
    <>
      {days > 0? (<><RenderDatePart number={days} letter="d" /> : </> ) : <></>}
      <RenderDatePart number={hours} letter="h" /> :
      <RenderDatePart number={minutes} letter="m" /> :
      <RenderDatePart number={seconds} letter="s" />
    </>
  );
}

const banner = (
  <div className="flex border rounded-xl border-slate-800 bg-slate-800 p-5 flex-col gap-1 md:gap-2 items-center justify-end">
    <div className="px-2 flex flex-col items-center text-center gap-3">
      <p>
        <span className="text-2xl font-bold mb-4 text-orange-500">Vote Closing In: </span>
      </p>
      <div className="text-slate-100">
        <div className="flex gap-1 items-center">
          <RenderCountdown />
        </div>
      </div>
      <div className="max-w-lg text-slate-400">
        Winners get a free shout-out in our newsletter, social media mentions, a winner's badge and more perks.
        <span className="inline sm:block">
          {' '}
          See details{' '}
          <a className="underline transition-opacity hover:text-scale-1200" href="/about">
            here
          </a>
          .
        </span>
      </div>
    </div>
  </div>
);

export default async function Home() {
  const today = new Date();
  const productService = new ProductsService(createBrowserClient());
  const week = await productService.getWeekNumber(today, 2);
  const launchWeeks = await productService.getPrevLaunchWeeks(today.getFullYear(), 2, week, 5);

  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8">
      {banner}

      <div className="mt-10 mb-12">
        {launchWeeks.map(group => (
          <>
            <div className="mt-3 text-slate-400 text-sm">This week's tools</div>
            <div className="mt-3 text-slate-400 text-sm">❗ Vote for your favorite <b className='text-orange-400'>↳</b></div>
            <ul className="mt-3 divide-y divide-slate-800/60">
              {/* {shuffleToolsBasedOnDate(group.products).map((product, idx) => (
                <ToolCardEffect key={idx} tool={product as ProductType} />
              ))} */}
              {group.products.map((product, idx) => (
                <ToolCardEffect key={idx} tool={product as ProductType} />
              ))}
            </ul>
          </>
        ))}
      </div>
    </section>
  );
}
