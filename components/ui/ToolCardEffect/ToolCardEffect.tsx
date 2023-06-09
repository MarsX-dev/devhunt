'use client';

import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolCard from '@/components/ui/ToolCard/ToolCard';
import ToolFooter from '@/components/ui/ToolCard/Tool.Footer';
import ToolViews from '@/components/ui/ToolCard/Tool.views';
import { ProductType } from '@/type';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default ({ tool }: { tool: ProductType }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true });

  return (
    <li ref={cardRef} className="py-3">
      <ToolCard href={'/tool/' + tool.slug}>
        <Logo src={tool.logo_url || ''} alt={tool.name} />
        <div className="w-full space-y-1">
          <Name>{tool.name}</Name>
          <Title className="line-clamp-2">{tool.slogan}</Title>
          <ToolFooter>
            <Tags items={[tool.product_pricing_types?.title ?? 'Free', ...(tool.product_categories || []).map(c => c.name)]} />
            <ToolViews count={tool.views_count} />
          </ToolFooter>
        </div>
        <div
          className={`flex-1 self-center flex justify-end duration-1000 delay-150 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Votes count={tool.votes_count} />
        </div>
      </ToolCard>
    </li>
  );
};
