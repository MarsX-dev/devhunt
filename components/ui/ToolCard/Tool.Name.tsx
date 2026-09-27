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
  <h3 className={mergeTW(`text-slate-100 font-medium flex min-w-0 gap-x-3 items-center ${className}`)}>
    {toolHref ? (
      <Link href={toolHref} className="min-w-0 truncate">
        {children}
      </Link>
    ) : (
      <span className="min-w-0 truncate">{children}</span>
    )}
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
      // Always in the layout, only invisible until hover: showing it never moves anything.
      className="invisible flex-none cursor-pointer group-hover/card:visible"
    >
      <ArrowTopRightOnSquareIcon className="w-4 h-4 pointer-events-none" />
    </span>
  </h3>
);
