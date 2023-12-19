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
import { useEffect, useRef } from 'react';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import Link from 'next/link';

export default ({ tool }: { tool: ProductType }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true });

  if (isInView) {
    new ProductsService(createBrowserClient()).viewed(tool.id); // track views
  }

  return (
    <li ref={cardRef} className="py-3">
      <ToolCard tool={tool} href={'/tool/' + tool.slug}>
        <div className="w-full flex items-center gap-x-4">
          <Logo src={tool.logo_url || ''} alt={tool.name} />
          <div className="w-full space-y-1">
            <Name href={tool.demo_url as string}>{tool.name}</Name>
            <Title className="line-clamp-2">{tool.slogan}</Title>
            <ToolFooter>
              <Tags items={[tool.product_pricing_types?.title ?? 'Free', ...(tool.product_categories || []).map(c => c.name)]} />
              <ToolViews count={tool.views_count} />
            </ToolFooter>
          </div>
        </div>
        <div className={`flex-1 self-center flex justify-end duration-1000 delay-150 ${isInView ? 'opacity-100 mt-0' : 'opacity-0 mt-8'}`}>
          <Votes count={tool.votes_count} productId={tool?.id} launchDate={tool.launch_date} launchEnd={tool.launch_end} />
        </div>
      </ToolCard>
    </li>
  );
};
