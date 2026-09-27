'use client';

import addHttpsToUrl from '@/utils/addHttpsToUrl';
import mergeTW from '@/utils/mergeTW';
import { ReactNode } from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default ({
  className,
  children,
  href,
  toolHref,
  linkIcon = true,
}: {
  className?: string;
  href?: string;
  toolHref?: string;
  children?: ReactNode;
  linkIcon?: boolean; // the "open website" icon (its space is reserved even when hidden)
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
    {linkIcon && (
      <span
        id="tool-title"
        role="link"
        tabIndex={0}
        aria-label="Open website in a new tab"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          window.open(`${addHttpsToUrl(href ?? '')}?ref=devhunt`, '_blank'); // never a javascript: or other non-web URL
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            window.open(`${addHttpsToUrl(href ?? '')}?ref=devhunt`, '_blank'); // never a javascript: or other non-web URL
          }
        }}
        // Always in the layout, only invisible until hover: showing it never moves anything.
        className="invisible flex-none cursor-pointer group-hover/card:visible"
      >
        <ArrowTopRightOnSquareIcon className="w-4 h-4 pointer-events-none" />
      </span>
    )}
  </h3>
);
