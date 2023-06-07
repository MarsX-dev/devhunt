import { IconCalendar } from '@/components/Icons';
import mergeTW from '@/utils/mergeTW';
import moment from 'moment';
import { type HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLSelectElement> {
  label: string;
  value?: string | number;
  className?: string;
  date?: {
    month?: number;
  };
  validate?: {};
}

export default ({ label, value, className = '', date: { month = new Date().getMonth() } = {}, validate, ...props }: Props) => {
  const currentDate = new Date();
  const getDaysInMonth = new Date(currentDate.getFullYear(), month, 0).getDate();
  const monthDays = Array.from({ length: getDaysInMonth }, (_, index) => index + 1);

  return (
    <div className="relative">
      <IconCalendar className="absolute top-0 bottom-0 w-6 h-6 my-auto text-gray-400 left-3" />
      <select
        {...props}
        {...validate}
        value={value}
        className={`pr-3 pl-12 py-2 appearance-none rounded-lg text-sm bg-slate-800 text-slate-300 outline-none ${mergeTW(className)}`}
      >
        <option value="" disabled selected>
          {label}
        </option>
        {monthDays.map(item => (
          <option value={new Date(currentDate.getFullYear(), month, item).toISOString()}>
            {moment(new Date(currentDate.getFullYear(), month, item)).format('LL')}
          </option>
        ))}
      </select>
    </div>
  );
};
