import { useEffect, useState } from 'react';
import { IconCalendar } from '@/components/Icons';
import mergeTW from '@/utils/mergeTW';
import moment from 'moment';
import { type HTMLAttributes } from 'react';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';

interface Props extends HTMLAttributes<HTMLSelectElement> {
  label: string;
  value?: string | number;
  className?: string;
  validate?: {};
}

export default ({ label, value, className = '', validate, ...props }: Props) => {
  const [weeks, setWeeks] = useState<{ week: number; startDate: Date; endDate: Date; count: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const launchDate = new Date('2023-08-01');
      const startDate = today < launchDate ? launchDate : today;

      const productsService = new ProductsService(createBrowserClient());
      const startWeek = await productsService.getWeekNumber(startDate, 2);
      const result = await productsService.getProductsCountByWeek(startWeek + 1, startWeek + 15, startDate.getFullYear());
      setWeeks(result);
    };

    void fetchData();
  }, []);

  return (
    <div className="relative">
      <IconCalendar className="absolute top-0 bottom-0 w-6 h-6 my-auto text-gray-400 left-3" />
      <select
        {...props}
        {...(validate ?? {})}
        value={value}
        className={`pr-3 pl-12 py-2 appearance-none rounded-lg text-sm bg-slate-800 text-slate-300 outline-none ${mergeTW(className)}`}
      >
        <option value="" disabled selected>
          {label}
        </option>
        {weeks.map(i => (
          <option disabled={i.count >= 15} value={i.week}>{`${moment(i.startDate).format('LL')} - ${moment(i.endDate).format('LL')} (${
            i.count
          }/${i.count > 15 ? i.count : 15})`}</option>
        ))}
      </select>
    </div>
  );
};
