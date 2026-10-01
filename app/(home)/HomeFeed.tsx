'use client';

import InlineSponsor from '@/components/ui/Sponsors/InlineSponsor';
import React, { type ReactNode, useState } from 'react';
import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { type ProductType } from '@/type';
import { createBrowserClient } from '@/utils/supabase/browser';
import CountdownPanel from '@/components/ui/CountdownPanel';
import MonitizorAdCards from '@/components/ui/MonitizerAdCards';
import ToolRow from '@/components/ui/ToolRow';
import SectionLabel from '@/components/ui/SectionLabel';
import { type LatestComment } from '@/utils/activity';
import { type HomeData } from '@/utils/homeData';
import { PAST_WINNERS, toToolRow } from '@/utils/toolRow';
import { sponsorBefore } from '@/utils/ads';

// Client part of the home page, rendered from server data: this week's contestants (one list, top 3 as
// taller rows), then this week's "other" tools (compact, no votes), then `featured`, past winners as rows ("Show more" loads further pages), then `bottom`.
// `children` render under the hero.
export default function HomeFeed({
  data,
  children,
  featured,
  bottom,
  votesToday = {},
  latestComments = {},
  uniqueVisitors,
}: {
  data: HomeData;
  children?: ReactNode;
  featured?: ReactNode;
  bottom?: ReactNode;
  votesToday?: Record<string, number>;
  latestComments?: Record<string, LatestComment>;
  uniqueVisitors?: number;
}) {
  const [winners, setWinners] = useState(data.winners);
  const [paging, setPaging] = useState({ offset: data.winnersOffset, total: data.winnersTotal, loadingMore: false });
  const contestants = data.contestants;

  // A top-3 tool with no comments yet shows who made it instead: "by [avatar] name".
  const makerLine = (product: ProductType, idx: number): LatestComment | undefined => {
    const maker = data.makers?.[product.id];
    if (idx >= 3 || !maker) return undefined;
    return { name: maker.name, avatar: maker.avatar, content: '', at: String(product.launch_start), maker: true };
  };

  const card = (product: ProductType, idx: number) => (
    <ToolCardEffect
      key={product.id ?? idx}
      tool={product}
      rank={idx + 1}
      compact={idx >= 3}
      votesToday={votesToday[product.id]}
      latestComment={latestComments[product.id] ?? makerLine(product, idx)}
      revealIndex={idx}
    />
  );

  async function showMoreWinners() {
    setPaging(state => ({ ...state, loadingMore: true }));
    const next = await new ProductsService(createBrowserClient()).getWeeklyWinnersPage(paging.offset, PAST_WINNERS);
    setWinners(current => [...current, ...next.rows.map(row => toToolRow(row.product))]);
    setPaging(state => ({ offset: state.offset + next.rows.length, total: next.total, loadingMore: false }));
  }

  const remaining = Math.max(0, paging.total - paging.offset);

  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8">
      <CountdownPanel uniqueVisitors={uniqueVisitors} />
      {children}
      <MonitizorAdCards />
      <div className="mt-12 mb-12">
        <SectionLabel title="This week's launches" hint="Vote for your favorite 👇" />
        {/* One list on the same columns: the top 3 are taller rows (meta line), the rest compact rows.
            Split in two only so the first ad slot can sit after the top 3. */}
        <ol id="podium" className="mt-2 divide-y divide-slate-800/70">
          {contestants.slice(0, 3).map(card)}
        </ol>
        {/* TinyAdz disabled (2026-09-28). To bring it back, restore this container and the script in app/layout.tsx.
        <div id="TA_AD_CONTAINER"></div> */}
        {sponsorBefore(3, contestants.length) >= 0 && (
          <ul className="border-t border-slate-800/70 py-1">
            <InlineSponsor rank="card" />
          </ul>
        )}
        {contestants.length > 3 && (
          <ol id="more-launches" start={4} className="divide-y divide-slate-800/70 border-t border-slate-800/70">
            {/* More sponsor rows further down (the first one, before #4, sits above this list). */}
            {contestants.slice(3).map((product, i) => {
              const idx = i + 3;
              const n = idx > 3 ? sponsorBefore(idx, contestants.length) : -1;
              return [n >= 0 && <InlineSponsor key={`sponsor-${idx}`} n={n} rank="card" className="py-1" />, card(product, idx)];
            })}
          </ol>
        )}

        {data.others.length > 0 && (
          <div id="also-launching" className="mt-14">
            <SectionLabel title="Also launching this week" hint="Not for developers, so not in the vote" />
            <ul className="mt-2 grid sm:grid-cols-2 sm:gap-x-6">
              {data.others.map((tool, idx) => [
                // Two columns: sponsor rows span both, before an even index so pairs stay intact.
                idx > 0 && sponsorBefore(idx - 1, data.others.length) >= 0 && (
                  <InlineSponsor key={`sponsor-${idx}`} n={sponsorBefore(idx - 1, data.others.length)} list={3} className="col-span-full" />
                ),
                <ToolRow key={tool.id} tool={tool} noVotes />,
              ])}
            </ul>
          </div>
        )}

        {featured}

        <div id="past-winners" className="mt-14">
          <SectionLabel title="Past winners" hint={`Top tool of each of the last ${winners.length} weeks`} />
          <ul className="mt-2">
            {winners.map((tool, idx) => [
              sponsorBefore(idx, winners.length) >= 0 && <InlineSponsor key={`sponsor-${idx}`} n={sponsorBefore(idx, winners.length)} list={1} />,
              <ToolRow key={tool.id} tool={tool} showDate />,
            ])}
          </ul>
          {remaining > 0 && (
            <button
              onClick={() => void showMoreWinners()}
              disabled={paging.loadingMore}
              className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-sm text-slate-300 duration-150 hover:border-slate-600 hover:text-slate-50 disabled:opacity-60"
            >
              {paging.loadingMore ? 'Loading...' : `Show more (${remaining} more winners)`}
            </button>
          )}
        </div>
      </div>
      {bottom}
    </section>
  );
}
