import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolCard from '@/components/ui/ToolCard/ToolCard';
import ProductsService from '@/utils/supabase/services/products';
import { createServerClient } from '@/utils/supabase/server';

export default async function Home() {
  let launchDays = [];
  const today = new Date();
  const endOfJuly = new Date('2023-06-30');

  // before the official launch
  if (today > endOfJuly) {
    launchDays = await new ProductsService(createServerClient()).getPrevLaunchDays(today, 10);
  } else {
    launchDays = await new ProductsService(createServerClient()).getNextLaunchDays(endOfJuly, 10);
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
            <div className="text-slate-400 text-sm">
              {group.launchDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <ul className="mt-3 divide-y divide-slate-800/60">
              {group.products?.map((product, idx) => (
                <li key={idx} className="py-3">
                  <ToolCard href={'/tool/' + product.slug}>
                    <Logo src={product.logo_url || ''} alt={product.name} />
                    <div className="space-y-1">
                      <Name>{product.name}</Name>
                      <Title className="line-clamp-1 sm:line-clamp-2">{product.slogan}</Title>
                      <Tags
                        items={[product.product_pricing_types?.title ?? 'Free', ...(product.product_categories || []).map(c => c.name)]}
                      />
                    </div>
                    <div className="flex-1 self-center flex justify-end">
                      <Votes count={product.votes_count} />
                    </div>
                  </ToolCard>
                </li>
              ))}
            </ul>
          </>
        ))}
      </div>
    </section>
  );
}
