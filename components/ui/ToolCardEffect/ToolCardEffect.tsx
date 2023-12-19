import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolCard from '@/components/ui/ToolCard/ToolCard';
import ToolFooter from '@/components/ui/ToolCard/Tool.Footer';
import ToolViews from '@/components/ui/ToolCard/Tool.views';
import { type ProductType } from '@/type';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffectWrapper from './ToolCardEffectWrapper';

export default ({ tool }: { tool: ProductType }) => {
  return (
    <ToolCardEffectWrapper ToolId={tool?.id}>
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
        <div className={`flex-1 self-center flex justify-end duration-1000 delay-150`}>
          <Votes count={tool.votes_count} productId={tool?.id} launchDate={tool.launch_date} launchEnd={tool.launch_end} />
        </div>
      </ToolCard>
    </ToolCardEffectWrapper>
  );
};
