import ProductsService from '@/utils/supabase/services/products';
import { createServerClient } from '@/utils/supabase/server';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { ProductType } from '@/type';

const { title, description, ogImage } = {
  title: 'Dev Hunt – The best new Dev Tools every day.',
  description: 'A launchpad for dev tools, built by developers for developers, open source, and fair.',
  ogImage: 'https://devhunt.org/devhuntog.png',
};

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: ogImage,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
};

export default async function Home() {
  let launchDays = [];
  const today = new Date();
  const endOfJuly = new Date('2023-06-30');
  const endOfYear = new Date('2023-12-31');

  // before the official launch
  if (today > endOfJuly) {
    launchDays = await new ProductsService(createServerClient()).getPrevLaunchDays(today, 10);
  } else {
    launchDays = await new ProductsService(createServerClient()).getNextLaunchDays(endOfYear, 10);
  }

  return (
    <section className="max-w-4xl mt-20 mx-auto px-4 md:px-8">
      <div className="prose prose-invert">
        <h1 className="text-slate-50 text-lg font-semibold">Hey Developers!</h1>
        <div className="whitespace-pre-wrap">
          📢 DevHunt's public launch: July 1st, 2023.
          <div className="p-1 w-full" id="id1"></div>
          Submit your dev tools & schedule launches from July 1st onwards ASAP. First submitted shown on top of the list on the launch day
          🔝.
          <p className="w-full"></p>
          ⏸️ Voting paused until then.
          <p className="w-full"></p>
          Let's build this together - by us, for us 💪😎
        </div>
      </div>

      <div className="mt-10 mb-12">
        {launchDays.map(group => (
          <>
            <div className="mt-3 text-slate-400 text-sm">
              {group.launchDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <ul className="mt-3 divide-y divide-slate-800/60">
              {group.products?.map((product, idx) => (
                <ToolCardEffect key={idx} tool={product as ProductType} />
              ))}
            </ul>
          </>
        ))}
      </div>
    </section>
  );
}
