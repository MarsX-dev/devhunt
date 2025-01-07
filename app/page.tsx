'use client';

import ProductsService from '@/utils/supabase/services/products';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { ProductType } from '@/type';
// import { shuffleToolsBasedOnDate } from '@/utils/helpers';
import { createBrowserClient } from '@/utils/supabase/browser';
import CountdownPanel from '@/components/ui/CountdownPanel';

import { useEffect, useState } from 'react';
import SkeletonToolCard from '@/components/ui/Skeletons/SkeletonToolCard';

function getDate(weekStartDay: number): Date {
  let today = new Date();
  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const dow = jan1.getDay();
  // Find first startDay on or after Jan 1
  const offset = (weekStartDay - dow + 7) % 7;
  const firstWeekStart = new Date(jan1.getTime() + offset * 86400000);
  if (today < firstWeekStart) {
    today = new Date(year - 1, 11, 31, 23, 59, 59);// Use last day of previous year
  }

  return today;
}

export default function Home() {
  const weekStartDay = 2;
  const today = getDate(weekStartDay);

  const productService = new ProductsService(createBrowserClient());
  const [launchWeeks, setLaunchWeeks] = useState([]);
  const [weeklyWinners, setWeeklyWinners] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const week = await productService.getWeekNumber(today, weekStartDay);
      const [launchWeeks, weeklyWinners] = await Promise.all([
        productService.getPrevLaunchWeeks(today.getFullYear(), weekStartDay, week, 1),
        productService.getWeeklyWinners(week),
      ]);
      setLaunchWeeks(launchWeeks as any);
      setWeeklyWinners(weeklyWinners as any);
      setLoading(false);
    };
    fetchData();
  }, []);

  function weekTools(group) {
    return (
      <>
        <div className="mt-3 text-slate-400 text-sm">
          Vote for your favorite dev tool this week<b className="text-orange-400">👇</b>
        </div>
        <ul className="mt-3 divide-y divide-slate-800/60">
          {group.products.map(
            (product, idx) =>
              // <ToolCardEffect key={idx} tool={product as ProductType} />
              product.isPaid && <ToolCardEffect key={idx} tool={product as ProductType} />,
          )}
        </ul>
      </>
    );
  }

  function prevWeekTools(group) {
    return (
      <>
        <div className="border-t border-slate-800 pt-8 mt-8 text-sm text-orange-500">
          <p className="mt-8">Past winners 👑</p>
        </div>
        <ul className="mt-3 divide-y divide-slate-800/60">
          {group.products.slice(0, 3).map((product, idx) => (
            <ToolCardEffect key={idx} tool={product as ProductType} />
          ))}
        </ul>
      </>
    );
  }

  function weekWinnerTools(products) {
    return (
      <>
        {/* Active */}
        <div className="border-t border-slate-800 pt-8 mt-8 text-sm text-orange-500">
          <p className="mt-8">Past winners 👑</p>
        </div>
        <ul className="relative mt-3 divide-y divide-slate-800/60">
          {products
            .sort((a, b) => b.votes_count - a.votes_count)
            .map((product, idx) => product.isPaid && <ToolCardEffect key={idx} tool={product as ProductType} />)}
          <div className="absolute -inset-x-2 -inset-y-0 -z-20 bg-slate-800/40 rounded-xl sm:-inset-x-3"></div>
        </ul>
      </>
    );
  }

  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8">
      <CountdownPanel />
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
