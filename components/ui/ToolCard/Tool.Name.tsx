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
    {/* Not an <a>: this sits inside the card's link, and nested anchors are invalid HTML. */}
    <span
      id="tool-title"
      role="link"
      tabIndex={0}
      aria-label="Open website in a new tab"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`${href}?ref=devhunt`, '_blank');
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          window.open(`${href}?ref=devhunt`, '_blank');
        }
      }}
      className="hidden group-hover/card:block cursor-pointer"
    >
      <ArrowTopRightOnSquareIcon className="w-4 h-4 pointer-events-none" />
    </span>
  </h3>
);
