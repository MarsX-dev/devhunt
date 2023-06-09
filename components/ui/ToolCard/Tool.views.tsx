import { IconChartBar } from '@/components/Icons';
import mergeTW from '@/utils/mergeTW';

export default ({ className, count }: { className?: string; count: number }) => (
  <div className={mergeTW(`flex gap-x-2 items-center font-medium text-xs text-slate-300 ${className}`)}>
    <IconChartBar className="w-3 h-3" />
    {count}
  </div>
);
