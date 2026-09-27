'use client';

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

// Client part of the home page, rendered from server data: this week's contestants (top 3 as full
// cards), then `featured`, past winners as rows ("Show more" loads further pages), then `bottom`.
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

  const card = (product: ProductType, idx: number) => (
    <ToolCardEffect
      key={product.id ?? idx}
      tool={product}
      rank={idx + 1}
      compact={idx >= 3}
      votesToday={votesToday[product.id]}
      latestComment={latestComments[product.id]}
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
        {/* The current top 3 get their own panel; the rest follow as compact rows on the same columns. */}
        <ol
          id="podium"
          className="mt-4 divide-y divide-slate-800/70 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-800/40 to-slate-900/0 px-3 sm:px-4"
        >
          {contestants.slice(0, 3).map(card)}
        </ol>
        <div id="TA_AD_CONTAINER"></div>
        {contestants.length > 3 && (
          <>
            <div className="mt-8 flex items-center gap-x-3 border-x border-transparent px-3 sm:px-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">Also launching this week</span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>
            {/* Transparent border: same 1px inset as the podium panel so the columns line up exactly. */}
            <ol id="more-launches" start={4} className="mt-2 divide-y divide-slate-800/70 border-x border-transparent px-3 sm:px-4">
              {contestants.slice(3).map((product, idx) => card(product, idx + 3))}
            </ol>
          </>
        )}

        {featured}

        <div id="past-winners" className="mt-14">
          <SectionLabel title="Past winners" hint={`Top tool of each of the last ${winners.length} weeks`} />
          <ul className="mt-2">
            {winners.map(tool => (
              <ToolRow key={tool.id} tool={tool} showDate />
            ))}
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
