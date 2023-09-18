import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { ProductType } from '@/type';
// import { shuffleToolsBasedOnDate } from '@/utils/helpers';
import { createBrowserClient } from '@/utils/supabase/browser';
import CountdownPanel from '@/components/ui/CountdownPanel';

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

export default async function Home() {
  const today = new Date();
  const productService = new ProductsService(createBrowserClient());
  const week = await productService.getWeekNumber(today, 2);
  const [launchWeeks, weeklyWinners] = await Promise.all([
    productService.getPrevLaunchWeeks(today.getFullYear(), 2, week, 1),
    productService.getWeeklyWinners(week),
  ]);

  function weekTools(group) {
    return (
      <>
        <div className="mt-3 text-slate-400 text-sm">This week's tools</div>
        <div className="mt-3 text-slate-400 text-sm">
          ❗ Vote for your favorite <b className="text-orange-400">↳</b>
        </div>
        <ul className="mt-3 divide-y divide-slate-800/60">
          {group.products.map((product, idx) => (
            <ToolCardEffect key={idx} tool={product as ProductType} />
          ))}
        </ul>
      </>
    );
  }

  function prevWeekTools(group) {
    return (
      <>
        <div className="mt-3 text-white text-sm">Previous week winners 👑</div>
        <ul className="mt-3 divide-y divide-slate-800/60">
          {group.products.slice(0, 3).map((product, idx) => (
            <ToolCardEffect key={idx} tool={product as ProductType} />
          ))}
        </ul>
      </>
    );
  }

  function weekWinnerTools(products) {
    return (
      <>
        <div className="mt-3 text-white text-sm">Previous weeks winners 👑</div>
        <ul className="mt-3 divide-y divide-slate-800/60">
          {products.map((product, idx) => (
            <ToolCardEffect key={idx} tool={product as ProductType} />
          ))}
        </ul>
      </>
    );
  }

  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8">
      <CountdownPanel />
      <div className="mt-10 mb-12">
        {launchWeeks.map((group, index) => (index > 0 ? prevWeekTools(group) : weekTools(group)))}
        {weekWinnerTools(weeklyWinners)}
      </div>
    </section>
  );
}
