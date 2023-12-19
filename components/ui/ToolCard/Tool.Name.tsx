'use client';

import mergeTW from '@/utils/mergeTW';
import { ReactNode } from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default ({
  className,
  children,
  href,
  toolHref,
}: {
  className?: string;
  href?: string;
  toolHref?: string;
  children?: ReactNode;
}) => (
  <h3 className={mergeTW(`text-slate-100 font-medium flex gap-x-3 items-center ${className}`)}>
    {toolHref ? <Link href={toolHref}>{children}</Link> : children}
    <a
      id="tool-title"
      href={`${href}?ref=devhunt`}
      onClick={() => window.open(`${href}?ref=devhunt`)}
      target="_blank"
      className="hidden group-hover/card:block"
    >
      <ArrowTopRightOnSquareIcon className="w-4 h-4 pointer-events-none" />
    </a>
  </h3>
);
