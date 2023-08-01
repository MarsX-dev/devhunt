'use client';

import ProductLogo from '@/components/ui/ToolCard/Tool.Logo';
import ToolName from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import ToolCard from '@/components/ui/ToolCard/ToolCard';
import AwardsService from '@/utils/supabase/services/awards';
import { createBrowserClient } from '@/utils/supabase/browser';
import ToolVotes from '@/components/ui/ToolCard/Tool.Votes';
import ToolFooter from '@/components/ui/ToolCard/Tool.Footer';
import ToolViews from '@/components/ui/ToolCard/Tool.views';
import { useEffect, useState } from 'react';
import { ProductType } from '@/type';

export default () => {
  const [trendingTools, setTrendingTools] = useState<ProductType[]>([]);

  useEffect(() => {
    const supabaseBrowserClient = createBrowserClient();
    const awardService = new AwardsService(supabaseBrowserClient);
    awardService.getWinnersOfTheWeek(new Date().getDay(), 10).then(tools => {
      const allTools = tools?.map(tool => tool);
      setTrendingTools(allTools as any);
    });
  }, []);

  return (
    <ul className="mt-3 divide-y divide-slate-800/60">
      {trendingTools?.map((item: ProductType, idx) => (
        <li key={idx} className="py-3">
          <ToolCard href={`/tool/${item.slug.toLowerCase()}`}>
            <ProductLogo src={item.logo_url as string} alt={item?.slogan as string} imgClassName="w-14 h-14" />
            <div className="w-full space-y-1">
              <ToolName>{item.name}</ToolName>
              <Title className="line-clamp-1 sm:line-clamp-2">{item?.slogan}</Title>
              <ToolFooter>
                <Tags items={[item.product_pricing, ...(item.product_categories ?? [])]} />
                <ToolViews count={item.views_count} />
              </ToolFooter>
            </div>
            <div className="self-center flex justify-end">
              <ToolVotes count={item.votes_count as number} />
            </div>
          </ToolCard>
        </li>
      ))}
    </ul>
  );
};
