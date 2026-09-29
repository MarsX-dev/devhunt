'use client';

import { IconVote } from '@/components/Icons';
import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolCard from '@/components/ui/ToolCard/ToolCard';
import { type ProductType } from '@/type';
import { useInView } from 'framer-motion';
import { type CSSProperties, Fragment, MouseEvent, useEffect, useRef, useState } from 'react';
import { queueView } from '@/utils/viewQueue';
import Link from 'next/link';
import { useIsomorphicLayoutEffect } from '@/utils/useIsomorphicLayoutEffect';
import { type LatestComment } from '@/utils/activity';
import ArrivingComment from './ArrivingComment';
import FloatingUpvotes from './FloatingUpvotes';

interface Props {
  tool: ProductType;
  rank?: number;
  compact?: boolean; // one-line row without the meta line (home page: below the top 3)
  votesToday?: number; // real votes in the last 24 hours: badge + floating upvotes
  latestComment?: LatestComment; // shown as an arriving comment once the card is on screen
  revealIndex?: number; // position in the list, for the one-by-one reveal
}

// A row of this week's list. Every row has the same columns; the top 3 are just taller (tagline and
// meta on their own lines), `compact` rows fit on one line.
export default ({ tool, rank, compact = false, votesToday = 0, latestComment, revealIndex }: Props) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true });

  useEffect(() => {
    if (isInView) queueView(tool.id); // one impression per visit, sent with the page's other cards
  }, [isInView, tool.id]);

  // Tools with real votes today first show one vote less, then the live replay counts it up.
  // Decided after hydration (before paint) so the server and first client render agree.
  const [pendingVote, setPendingVote] = useState(false);
  useIsomorphicLayoutEffect(() => {
    if (votesToday > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPendingVote(true);
  }, [votesToday]);

  const reveal: CSSProperties | undefined =
    revealIndex === undefined ? undefined : { animationDelay: `${Math.min(revealIndex, 14) * 55}ms` };

  function preventDefault(e: MouseEvent) {
    e.preventDefault();
  }
  // Upvotes in the last 24 hours, with the ▲ of the vote button. On the top 3 it follows the categories,
  // not the impressions, so it doesn't read as more impressions.
  const todayLabel = `${votesToday} ${votesToday === 1 ? 'upvote' : 'upvotes'} today`;
  const todayBadge = votesToday > 0 && (
    <span
      title={todayLabel}
      className="inline-flex flex-none items-center gap-x-1 font-mono text-[11px] text-green-400 tabular-nums"
    >
      <IconVote className="h-2.5 w-2.5" />
      <span className="sr-only">{todayLabel}</span>
      <span aria-hidden>+{votesToday} today</span>
    </span>
  );

  return (
    <li
      ref={cardRef}
      className={`py-1 ${revealIndex === undefined ? '' : 'motion-safe:animate-slide-up'}`}
      style={reveal}
    >
      <ToolCard
        tool={tool}
        href={'/tool/' + tool.slug}
        className={compact ? 'py-1.5' : 'py-3'}
        votesToday={votesToday}
        below={
          latestComment && (
            // Inside the card so its hover background covers it too. Indented to start exactly under
            // the tool name: [rank 20px + gap 4px] + logo 40px + gap 16px.
            <div className={`${compact ? '-mt-1 pb-2' : '-mt-2 pb-3'} pl-[56px] ${rank ? 'sm:pl-[80px]' : ''}`}>
              <ArrivingComment comment={latestComment} active={isInView} />
            </div>
          )
        }
      >
        {/* Same columns in every row (rank 20px + 4px gap, logo 40px, text, votes 56px) so the whole list lines up. */}
        <div className="flex w-full min-w-0 items-center gap-x-4">
          {rank && (
            <span
              className={`hidden sm:block -mr-3 w-5 flex-none text-left font-mono text-sm tabular-nums ${
                rank <= 3 ? 'text-orange-500' : 'text-slate-600'
              }`}
            >
              {rank}
            </span>
          )}
          <Link onClick={preventDefault} href={'/tool/' + tool.slug} className="flex-none">
            <Logo src={tool.logo_url || ''} alt={tool.name} imgClassName="h-10 w-10 rounded-lg" />
          </Link>
          <div className="w-full min-w-0 space-y-1">
            {compact ? (
              // One line: name · tagline, like the other lists. No "open website" icon here: its reserved
              // space left an uneven gap before the tagline. The today badges line up on the right.
              <div className="flex min-w-0 items-center gap-x-3">
                <div className="flex min-w-0 flex-1 items-center gap-x-1.5 text-sm">
                  <Name href={tool.demo_url as string} linkIcon={false} className="max-w-full flex-none text-sm sm:max-w-[60%]">
                    {tool.name}
                  </Name>
                  {/* Phones: the name only (a few letters of tagline say nothing). */}
                  <Link onClick={preventDefault} href={'/tool/' + tool.slug} className="hidden min-w-0 truncate text-slate-500 sm:block">
                    · {tool.slogan}
                  </Link>
                </div>
                {todayBadge}
              </div>
            ) : (
              <>
                <Name href={tool.demo_url as string}>{tool.name}</Name>
                <Link onClick={preventDefault} href={'/tool/' + tool.slug}>
                  <Title className="line-clamp-1 sm:text-[15px]">{tool.slogan}</Title>
                </Link>
                {/* One quiet mono line: impressions · pricing · categories · upvotes today. */}
                <div className="flex flex-wrap items-center gap-x-2 pt-0.5 font-mono text-xs leading-5 text-slate-500">
                  {[
                    `${(tool.views_count ?? 0).toLocaleString('en-US')} impressions`,
                    tool.product_pricing_types?.title ?? 'Free',
                    ...(tool.product_categories || []).slice(0, 2).map(c => c.name),
                  ].map((item, idx) => (
                    <Fragment key={idx}>
                      {idx > 0 && <span className="text-slate-700">·</span>}
                      <span className="tabular-nums">{item}</span>
                    </Fragment>
                  ))}
                  {todayBadge && (
                    <>
                      <span className="text-slate-700">·</span>
                      {todayBadge}
                    </>
                  )}
                </div>
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
            variant="inline"
            className="w-14 justify-center"
            pending={pendingVote ? 1 : 0}
          />
          <FloatingUpvotes votesToday={votesToday} active={isInView} onBurst={() => setPendingVote(false)} />
        </div>
      </ToolCard>
    </li>
  );
};
