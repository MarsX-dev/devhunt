import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { ProductType } from '@/type';
// import { shuffleToolsBasedOnDate } from '@/utils/helpers';
import { createBrowserClient } from '@/utils/supabase/browser';

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

export default async function Home() {
  const today = new Date();
  const productService = new ProductsService(createBrowserClient());
  const week = await productService.getWeekNumber(today, 2);
  const launchWeeks = await productService.getPrevLaunchWeeks(today.getFullYear(), 2, week, 5);

  return (
    <section className="max-w-4xl mt-20 mx-auto px-4 md:px-8">
      <div className="prose prose-invert">
        <div className="font-sans p-6 bg-slate-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-orange-500">Hey Devs 🙌</h1>

          <p className="mb-4 text-red-400">It's on! DevHunt is live and kicking.</p>

          <p className="mb-1 ">
            It's a weekly contest where your tools compete for the <b className='text-orange-400'>'Tool of The Week'</b> prize. <br/>🏆 Winners get some cool
            stuff from us:
          </p>

          <ul className="list-disc pl-5 mt-1 mb-4 text-green-400">
            <li>A feature in our newsletter 📨</li>
            <li>Shout-outs with tech influencers on Twitter 🐦</li>
            <li>A sweet winner badge on their listing 👑</li>
          </ul>

          <p>Voting ends every Monday night (UTC), so make sure you get your votes in before then!</p>

          <div className="mt-6">We built this platform together; now let's make it shine.<br/> Happy hunting! 😎🚀 👇 👇 👇 </div>
        </div>
      </div>

      <div className="mt-10 mb-12">
        {launchWeeks.map(group => (
          <>
            <div className="mt-3 text-slate-400 text-sm">
              {group.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
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
