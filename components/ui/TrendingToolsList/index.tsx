'use client';

import ToolName from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import ToolCard from '@/components/ui/ToolCard/ToolCard';
import { createBrowserClient } from '@/utils/supabase/browser';
import ToolVotes from '@/components/ui/ToolCard/Tool.Votes';
import ToolFooter from '@/components/ui/ToolCard/Tool.Footer';
import ToolViews from '@/components/ui/ToolCard/Tool.views';
import { useEffect, useState } from 'react';
import { ProductType } from '@/type';
import ProductsService from '@/utils/supabase/services/products';
import ToolLogo from '@/components/ui/ToolCard/Tool.Logo';
import Link from 'next/link';

const getTrendingTools = async () => {
  const today = new Date();
  const productService = new ProductsService(createBrowserClient());
  const week = await productService.getWeekNumber(today, 2);
  return await productService.getPrevLaunchWeeks(today.getFullYear(), 2, week, 1);
};

export default () => {
  const [trendingTools, setTrendingTools] = useState<[]>([]);

  useEffect(() => {
    getTrendingTools().then(tools => {
      const allTools = tools?.map(tool => tool);
      setTrendingTools(allTools as any);
    });
  }, []);

  return (
    <ul className="mt-3 divide-y divide-slate-800/60">
      {trendingTools?.map(group => (
        <div>
          {(group as { products: ProductType[] }).products.map((tool: ProductType, idx: number) => (
            <li key={idx} className="py-3">
              <ToolCard tool={tool} href={'/tool/' + tool.slug}>
                <Link onClick={e => e.preventDefault()} href={'/tool/' + tool.slug} className="w-full flex items-center gap-x-4">
                  <ToolLogo src={tool.logo_url || ''} alt={tool.name} />
                  <div className="w-full space-y-1">
                    <ToolName href={tool.demo_url as string}>{tool.name}</ToolName>
                    <Title className="line-clamp-2">{tool.slogan}</Title>
                    <ToolFooter>
                      <Tags items={[tool.product_pricing_types?.title ?? 'Free', ...(tool.product_categories || []).map(c => c.name)]} />
                      <ToolViews count={tool.views_count} />
                    </ToolFooter>
                  </div>
                </Link>
                <ToolVotes count={tool.votes_count} productId={tool?.id} launchDate={tool.launch_date} launchEnd={tool.launch_end} />
              </ToolCard>
            </li>
          ))}
        </div>
      ))}
    </ul>
  );
};
