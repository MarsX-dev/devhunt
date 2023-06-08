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
  validate?: undefined;
}

export default ({ label, value, className = '', validate, ...props }: Props) => {
  const [days, setDays] = useState<{ date: Date; count: number; }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const launchDate = new Date('2023-07-01');
      const startDate = today < launchDate ? launchDate : today;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);
      const result = await new ProductsService(createBrowserClient()).getProductsCountByDay(startDate, endDate);
      setDays(result);
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
        {days.map(i => (
          <option value={i.date.toISOString()}>
            {`${moment(i.date).format('LL')} (${i.count})`}
          </option>
        ))}
      </select>
    </div>
  );
};
