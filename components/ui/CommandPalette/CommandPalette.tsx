import { IconSearch } from '@/components/Icons';
import BlurBackground from '../BlurBackground/BlurBackground';
import SearchItem from './SearchItem';
import EmptyState from './EmptyState';
import { useEffect, useState } from 'react';
import { Product } from '@/utils/supabase/types';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';

type ITrend = {
  name: string;
  href: string;
};

type Props = {
  isCommandActive: boolean;
  searchResult?: Product[];
  trend?: ITrend[];
  searchValue?: string;
  setCommandActive?: (val: boolean) => void;
  setSearch?: (val: string) => void;
};

export default ({
  isCommandActive,
  searchResult = [],
  searchValue = '',
  setCommandActive = () => false,
  setSearch = () => '',
  trend = [],
}: Props) => {
  const getTrendingTools = async () => {
    const today = new Date();
    const productService = new ProductsService(createBrowserClient());
    const week = await productService.getWeekNumber(today, 2);
    return await productService.getPrevLaunchWeeks(today.getFullYear(), 2, week, 1);
  };

  const [trendingTools, setTrendingTools] = useState<[]>([]);

  useEffect(() => {
    getTrendingTools().then(tools => {
      const allTools = tools?.map(tool => tool);
      setTrendingTools(allTools as any);
    });
  }, []);

  useEffect(() => {
    isCommandActive ? document.body.classList.add('overflow-hidden') : document.body.classList.remove('overflow-hidden');
  }, [isCommandActive]);

  const handleClick = () => {
    setCommandActive(false);
  };

  return isCommandActive ? (
    <div className="fixed z-30 w-full h-full inset-0 rounded-xl flex items-center justify-center px-4">
      <BlurBackground isActive={true} setActive={setCommandActive} />
      <div className="flex-1 max-w-xl rounded-xl bg-slate-900 bg-gradient-to-l from-slate-900 to-indigo-800/10 shadow-lg relative z-30">
        <div className="flex gap-x-3 items-center p-5 border-b border-slate-800">
          <IconSearch className="flex-none text-slate-400" />
          <input
            type="text"
            autoFocus
            onChange={e => setSearch(e.target.value)}
            value={searchValue}
            placeholder="Search for tools"
            className="flex-1 text-slate-400 text-sm outline-none bg-transparent"
          />
        </div>
        <ul className="py-4 px-2 h-full max-h-[300px] overflow-auto">
          {searchValue ? (
            searchResult.length > 0 ? (
              searchResult.map((item, idx) => (
                <li key={idx}>
                  <SearchItem onClick={handleClick} item={item} />
                </li>
              ))
            ) : (
              <EmptyState />
            )
          ) : (
            <div>
              <h3 className="text-sm font-medium text-slate-500 p-3">Current week tools</h3>
              <ul className="text-sm">
                {trendingTools.map((group, idx) =>
                  (group as { products: [] }).products.map((item, idx) => (
                    <li key={idx}>
                      <SearchItem onClick={handleClick} item={item} />
                    </li>
                  )),
                )}
              </ul>
            </div>
          )}
        </ul>
      </div>
    </div>
  ) : (
    <></>
  );
};
