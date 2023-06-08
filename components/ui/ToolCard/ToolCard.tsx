import mergeTW from '@/utils/mergeTW';
import Link from 'next/link';
import { ReactNode } from 'react';

export default ({ href, className, children }: { href: string; className?: string; children?: ReactNode }) => (
  <Link href={href} className={mergeTW(`flex items-start gap-x-4 relative py-4 rounded-2xl group ${className}`)}>
    {children}
    <div className="absolute -z-10 -inset-3 rounded-2xl group-hover:bg-slate-800/60 opacity-0 group-hover:opacity-100 duration-150"></div>
  </Link>
);
