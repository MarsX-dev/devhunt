'use client';

import { Product } from '@/utils/supabase/types';
import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolCard from '@/components/ui/ToolCard/ToolCard';

function preventDefault(e: MouseEvent) {
  e.preventDefault();
}

export interface ITool extends Product {
  product_pricing_types: {
    title: string;
  };
  product_categories: { name: string }[];
}

export default ({ tool }: { tool: ITool }) => (
  <li className="py-3">
    <ToolCard tool={tool} href={`/tool/${tool.slug}`}>
      <Logo src={tool.logo_url || ''} alt={tool.name} />
      <div className="space-y-1">
        <Name href={tool.demo_url as string}>{tool.name}</Name>
        <Title className="line-clamp-2">{tool.slogan}</Title>
        <Tags
          items={[
            (tool.product_pricing_types as { title: string }).title || 'Free',
            ...(tool.product_categories as { name: string }[]).map((c: { name: string }) => c.name),
          ]}
        />
      </div>
      <div className="flex-1 self-center flex justify-end">
        <Votes count={tool.votes_count} productId={tool?.id} launchDate={tool.launch_date} launchEnd={tool.launch_end as string} />
      </div>
    </ToolCard>
  </li>
);
