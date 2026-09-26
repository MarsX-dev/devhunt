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

const PAST_WINNERS = 30;

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

// Client part of the home page: this week's contestants as full cards, past winners as rows.
export default function HomeFeed({ children }: { children?: ReactNode }) {
  const weekStartDay = 2;
  const today = getDate(weekStartDay);
  const productService = new ProductsService(createBrowserClient());
  const [launchWeeks, setLaunchWeeks] = useState([]);
  const [weeklyWinners, setWeeklyWinners] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const [currentWeek, setCurrentWeek] = useState<number>();

  useEffect(() => {
    const fetchData = async () => {
      const week = await productService.getWeekNumber(today, weekStartDay);
      setCurrentWeek(week);
      const [launchWeeks, weeklyWinners] = await Promise.all([
        productService.getPrevLaunchWeeks(today.getFullYear(), weekStartDay, week, 1),
        productService.getWeeklyWinners(week, today.getFullYear(), PAST_WINNERS),
      ]);
      setLaunchWeeks(launchWeeks as any);
      setWeeklyWinners(weeklyWinners as any);
      setLoading(false);
    };
    fetchData();
  }, []);

  function weekTools(group: { products: ProductType[] }) {
    return (
      <>
        <div className="mt-3 text-slate-400 text-sm">
          Vote for your favorite dev tool this week<b className="text-orange-400">👇</b>
        </div>
        <ul className="mt-3 divide-y divide-slate-800/60">
          {group.products.map((product: ProductType, idx: number) => (
            <Fragment key={product.id ?? idx}>
              {idx === 3 && <div id="TA_AD_CONTAINER"></div>}
              {product.week == currentWeek && product.launch_start && <ToolCardEffect tool={product as ProductType} />}
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

  function weekWinnerTools(products: ProductType[]) {
    return (
      <div id="past-winners" className="border-t border-slate-800 pt-8 mt-8">
        <p className="text-sm text-orange-500">Past winners 👑</p>
        <p className="mt-1 text-xs text-slate-500">The top tool of each of the last {products.length} weeks</p>
        <ul className="mt-3">
          {products.map(product => (
            <WinnerRow key={product.id} tool={product} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8">
      {children}
      <CountdownPanel />
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
        <div className="mt-10 mb-12">
          {launchWeeks.map((group, index) => (index > 0 ? prevWeekTools(group) : weekTools(group)))}
          {weekWinnerTools(weeklyWinners)}
        </div>
      )}
    </section>
  );
}
