'use client';

import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { ProductType } from '@/type';
// import { shuffleToolsBasedOnDate } from '@/utils/helpers';
import { createBrowserClient } from '@/utils/supabase/browser';
import CountdownPanel from '@/components/ui/CountdownPanel';

import React, { Fragment, type ReactNode, useEffect, useState } from 'react';
import SkeletonToolCard from '@/components/ui/Skeletons/SkeletonToolCard';
import MonitizorAdCards from '@/components/ui/MonitizerAdCards';
import WinnerRow from '@/components/ui/WinnerRow';
import SectionLabel from '@/components/ui/SectionLabel';

const PAST_WINNERS = 30; // shown at first, and loaded per "Show more"

function getDate(weekStartDay: number): Date {
  let today = new Date();
  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const dow = jan1.getDay();
  // Find first startDay on or after Jan 1
  const offset = (weekStartDay - dow + 7) % 7;
  const firstWeekStart = new Date(jan1.getTime() + offset * 86400000);
  if (today < firstWeekStart) {
    today = new Date(year - 1, 11, 31, 23, 59, 59); // Use last day of previous year
  }

  return today;
}

// Client part of the home page: this week's contestants (top 3 as full cards), past winners as rows.
// `children` render under the hero, `bottom` after the lists.
export default function HomeFeed({
  children,
  bottom,
  votesToday = {},
}: {
  children?: ReactNode;
  bottom?: ReactNode;
  votesToday?: Record<string, number>;
}) {
  const weekStartDay = 2;
  const today = getDate(weekStartDay);
  const productService = new ProductsService(createBrowserClient());
  const [launchWeeks, setLaunchWeeks] = useState([]);
  const [weeklyWinners, setWeeklyWinners] = useState<ProductType[]>([]);
  const [winners, setWinners] = useState({ offset: 0, total: 0, loadingMore: false });
  const [isLoading, setLoading] = useState(true);

  const [currentWeek, setCurrentWeek] = useState<number>();

  useEffect(() => {
    const fetchData = async () => {
      const week = await productService.getWeekNumber(today, weekStartDay);
      setCurrentWeek(week);
      const [launchWeeks, firstWinners] = await Promise.all([
        productService.getPrevLaunchWeeks(today.getFullYear(), weekStartDay, week, 1),
        productService.getWeeklyWinnersPage(0, PAST_WINNERS + 1), // +1: the running week is left out
      ]);
      const isRunningWeek = (row: { week: number; year: number }) => row.week === week && row.year === today.getFullYear();
      const shown = firstWinners.rows.filter(row => !isRunningWeek(row)).slice(0, PAST_WINNERS);
      const skipped = firstWinners.rows.some(isRunningWeek) ? 1 : 0;
      setLaunchWeeks(launchWeeks as any);
      setWeeklyWinners(shown.map(row => row.product as ProductType));
      setWinners({ offset: shown.length + skipped, total: firstWinners.total, loadingMore: false });
      setLoading(false);
    };
    fetchData();
  }, []);

  function weekTools(group: { products: ProductType[] }) {
    const contestants = group.products.filter(product => product.week == currentWeek && product.launch_start);
    return (
      <>
        <SectionLabel title="This week's launches" hint="Vote for your favorite 👇" />
        <ul className="mt-2 divide-y divide-slate-800/70">
          {contestants.map((product: ProductType, idx: number) => (
            <Fragment key={product.id ?? idx}>
              {idx === 3 && <div id="TA_AD_CONTAINER"></div>}
              <ToolCardEffect tool={product as ProductType} rank={idx + 1} compact={idx >= 3} votesToday={votesToday[product.id]} />
            </Fragment>
          ))}
        </ul>
      </>
    );
  }

  function prevWeekTools(group: { products: ProductType[] }) {
    return (
      <>
        <div className="border-t border-slate-800 pt-8 mt-8 text-sm text-orange-500">
          <p className="mt-8">Past winners 👑</p>
        </div>
        <ul className="mt-3 divide-y divide-slate-800/60">
          {group.products.slice(0, 3).map((product: ProductType, idx: number) => (
            <ToolCardEffect key={idx} tool={product as ProductType} />
          ))}
        </ul>
      </>
    );
  }

  async function showMoreWinners() {
    setWinners(state => ({ ...state, loadingMore: true }));
    const next = await productService.getWeeklyWinnersPage(winners.offset, PAST_WINNERS);
    setWeeklyWinners(current => [...current, ...next.rows.map(row => row.product as ProductType)]);
    setWinners(state => ({ offset: state.offset + next.rows.length, total: next.total, loadingMore: false }));
  }

  function weekWinnerTools(products: ProductType[]) {
    const remaining = Math.max(0, winners.total - winners.offset);
    return (
      <div id="past-winners" className="mt-14">
        <SectionLabel title="Past winners" hint={`Top tool of each of the last ${products.length} weeks`} />
        <ul className="mt-2">
          {products.map(product => (
            <WinnerRow key={product.id} tool={product} />
          ))}
        </ul>
        {remaining > 0 && (
          <button
            onClick={() => void showMoreWinners()}
            disabled={winners.loadingMore}
            className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-sm text-slate-300 duration-150 hover:border-slate-600 hover:text-slate-50 disabled:opacity-60"
          >
            {winners.loadingMore ? 'Loading...' : `Show more (${remaining} more winners)`}
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8">
      <CountdownPanel />
      {children}
      <MonitizorAdCards />
      {isLoading ? (
        <div className="mt-14">
          <div>
            <div className="w-24 h-3 rounded-full bg-slate-700 animate-pulse"></div>
            <div className="w-32 h-3 mt-2 rounded-full bg-slate-700 animate-pulse"></div>
          </div>
          <ul className="mt-5 space-y-4">
            {Array(25)
              .fill('')
              .map((item, idx) => (
                <SkeletonToolCard key={idx} />
              ))}
          </ul>
        </div>
      ) : (
        <div className="mt-12 mb-12">
          {launchWeeks.map((group, index) => (index > 0 ? prevWeekTools(group) : weekTools(group)))}
          {weekWinnerTools(weeklyWinners)}
        </div>
      )}
      {bottom}
    </section>
  );
}
