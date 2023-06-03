import mergeTW from '@/utils/mergeTW';
import Link from 'next/link';
import { ReactNode } from 'react';

export default ({ href, className, children }: { href: string; className?: string; children?: ReactNode }) => (
  <Link href={href} className={mergeTW(`flex items-start gap-x-4 p-4 rounded-2xl hover:bg-slate-800/60 duration-150 ${className}`)}>
    {children}
  </Link>
);
