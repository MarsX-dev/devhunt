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
import { type CSSProperties, MouseEvent, useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import Link from 'next/link';
import { type LatestComment } from '@/utils/activity';
import ArrivingComment from './ArrivingComment';
import FloatingUpvotes from './FloatingUpvotes';

interface Props {
  tool: ProductType;
  rank?: number;
  compact?: boolean; // slimmer row (home page: below the top 3)
  votesToday?: number; // real votes in the last 24 hours: badge + floating upvotes
  latestComment?: LatestComment; // shown as an arriving comment once the card is on screen
  revealIndex?: number; // position in the list, for the one-by-one reveal
}

// Full card for the top 3 of the week (and everywhere else); `compact` is a slimmer row for the rest.
export default ({ tool, rank, compact = false, votesToday = 0, latestComment, revealIndex }: Props) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true });

  useEffect(() => {
    if (isInView) void new ProductsService(createBrowserClient()).viewed(tool.id); // one impression per visit
  }, [isInView, tool.id]);

  // Tools with real votes today first show one vote less, then the live replay counts it up.
  const [pendingVote, setPendingVote] = useState(
    () => votesToday > 0 && typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const reveal: CSSProperties | undefined =
    revealIndex === undefined ? undefined : { animationDelay: `${Math.min(revealIndex, 14) * 55}ms` };

  function preventDefault(e: MouseEvent) {
    e.preventDefault();
  }
  const todayBadge = votesToday > 0 && (
    <span className="flex-none font-mono text-[11px] text-green-400 tabular-nums">+{votesToday} today</span>
  );

  return (
    <li
      ref={cardRef}
      className={`${compact ? 'py-0.5' : 'py-3'} ${revealIndex === undefined ? '' : 'motion-safe:animate-slide-up'}`}
      style={reveal}
    >
      <ToolCard tool={tool} href={'/tool/' + tool.slug} className={compact ? 'py-2.5' : ''}>
        {/* Same columns in both sizes (rank 24px, logo 56px, text, votes 56px) so the whole list lines up. */}
        <div className="w-full flex items-center gap-x-4">
          {rank && (
            <span
              className={`hidden sm:block w-6 flex-none text-right font-mono text-sm tabular-nums ${rank <= 3 ? 'text-orange-500' : 'text-slate-600'}`}
            >
              {rank}
            </span>
          )}
          <Link onClick={preventDefault} href={'/tool/' + tool.slug} className="flex w-14 flex-none justify-center">
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
        <div className="relative flex-none self-center">
          <Votes
            count={tool.votes_count}
            productId={tool?.id}
            launchDate={tool.launch_date}
            launchEnd={tool.launch_end as string}
            className={compact ? 'py-1' : ''}
            pending={pendingVote ? 1 : 0}
          />
          <FloatingUpvotes votesToday={votesToday} active={isInView} onBurst={() => setPendingVote(false)} />
        </div>
      </ToolCard>
      {latestComment && (
        // Indented to start exactly under the tool name: [rank 24px + gap 16px] + logo 56px + gap 16px.
        <div className={`${compact ? '-mt-1.5' : '-mt-2.5'} pl-[72px] ${rank ? 'sm:pl-[112px]' : ''}`}>
          <ArrivingComment comment={latestComment} active={isInView} />
        </div>
      )}
    </li>
  );
};
