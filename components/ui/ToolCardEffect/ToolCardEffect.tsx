'use client';

import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolCard from '@/components/ui/ToolCard/ToolCard';
import ToolFooter from '@/components/ui/ToolCard/Tool.Footer';
import ToolViews from '@/components/ui/ToolCard/Tool.views';
import { type ProductType } from '@/type';
import { useInView } from 'framer-motion';
import { MouseEvent, useRef } from 'react';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import Link from 'next/link';

// Full card for the top 3 of the week (and everywhere else); `compact` is a slimmer row for the rest.
export default ({ tool, rank, compact = false, votesToday = 0 }: { tool: ProductType; rank?: number; compact?: boolean; votesToday?: number }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true });

  if (isInView) {
    new ProductsService(createBrowserClient()).viewed(tool.id); // track views
  }

  function preventDefault(e: MouseEvent) {
    e.preventDefault();
  }
  const todayBadge = votesToday > 0 && (
    <span className="flex-none font-mono text-[11px] text-green-400 tabular-nums">+{votesToday} today</span>
  );

  return (
    <li ref={cardRef} className={compact ? 'py-0.5' : 'py-3'}>
      <ToolCard tool={tool} href={'/tool/' + tool.slug} className={compact ? 'py-2.5' : ''}>
        <div className={`w-full flex items-center ${compact ? 'gap-x-3' : 'gap-x-4'}`}>
          {rank && (
            <span
              className={`hidden sm:block w-6 flex-none text-right font-mono text-sm tabular-nums ${rank <= 3 ? 'text-orange-500' : 'text-slate-600'}`}
            >
              {rank}
            </span>
          )}
          <Link onClick={preventDefault} href={'/tool/' + tool.slug} className="flex-none">
            <Logo src={tool.logo_url || ''} alt={tool.name} imgClassName={compact ? 'w-10 h-10 rounded-lg' : ''} />
          </Link>
          <div className="w-full min-w-0 space-y-1">
            {compact ? (
              <>
                <div className="flex items-center gap-x-2">
                  <Name href={tool.demo_url as string} className="text-[15px]">
                    {tool.name}
                  </Name>
                  {todayBadge}
                </div>
                <Link onClick={preventDefault} href={'/tool/' + tool.slug}>
                  <Title className="line-clamp-1 text-sm sm:text-sm">{tool.slogan}</Title>
                </Link>
              </>
            ) : (
              <>
                <Name href={tool.demo_url as string}>{tool.name}</Name>
                <Link onClick={preventDefault} href={'/tool/' + tool.slug}>
                  <Title className="line-clamp-2">{tool.slogan}</Title>
                </Link>
                <ToolFooter>
                  <Tags items={[tool.product_pricing_types?.title ?? 'Free', ...(tool.product_categories || []).map(c => c.name)]} />
                  <ToolViews count={tool.views_count} />
                  {todayBadge}
                </ToolFooter>
              </>
            )}
          </div>
        </div>
        <div
          className={`flex-1 self-center flex justify-end duration-1000 delay-150 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Votes
            count={tool.votes_count}
            productId={tool?.id}
            launchDate={tool.launch_date}
            launchEnd={tool.launch_end as string}
            className={compact ? 'w-12 py-1' : ''}
          />
        </div>
      </ToolCard>
    </li>
  );
};
