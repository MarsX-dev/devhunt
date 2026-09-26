import mergeTW from '@/utils/mergeTW';

export default ({ className, count }: { className?: string; count: number }) => (
  <div className={mergeTW(`flex gap-x-3 items-center text-[13px] text-slate-500 ${className}`)}>
    <div className="flex items-center gap-x-1">
      {count}
      <span>Impressions</span>
    </div>
  </div>
);
