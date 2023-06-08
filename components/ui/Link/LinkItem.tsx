import mergeTW from '@/utils/mergeTW';
import Link from 'next/link';
import { AnchorHTMLAttributes, ReactNode } from 'react';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  href: string;
  className?: string;
}

export default ({ children, href, className = '', ...props }: Props) => (
  <Link
    {...props}
    href={href}
    className={mergeTW(`py-2.5 px-4 rounded-lg duration-150 font-medium text-center text-sm text-white bg-slate-800 ${className}`)}
  >
    {children}
  </Link>
);
