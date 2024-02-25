'use client';

import mergeTW from '@/utils/mergeTW';
import { MouseEvent, ReactNode } from 'react';

export default ({ href, className, children }: { href: string; className?: string; children?: ReactNode }) => {
  const handleClick = (e: MouseEvent) => {
    window.open(href, '_blank');
  };
  return (
    <div
      onClick={handleClick}
      className={mergeTW(`flex items-start gap-x-4 relative py-4 rounded-2xl cursor-pointer group group/card ${className}`)}
    >
      {children}
      <div className="absolute -z-10 -inset-2 rounded-2xl group-hover:bg-slate-800/60 opacity-0 group-hover:opacity-100 duration-150 sm:-inset-3"></div>
    </div>
  );
};
