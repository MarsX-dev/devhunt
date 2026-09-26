import { Fragment } from 'react';

export default ({ items }: { items: any[] }) => (
  <div className="flex flex-wrap items-center gap-x-2.5 text-[13px] text-slate-500">
    {items.slice(0, 3).map((item, idx) => (
      <Fragment key={idx}>
        <span className="flex-none">{item}</span>
        <span className="block flex-none w-0.5 h-0.5 bg-slate-600 rounded-full"></span>
      </Fragment>
    ))}
  </div>
);
