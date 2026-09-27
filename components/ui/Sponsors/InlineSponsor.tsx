'use client';

import { useMemo } from 'react';
import { HOUSE_AD } from '@/utils/ads';
import { useLiveAds } from './SponsorRails';

// Native ad row in tool lists (same columns as ToolRow): one of the inline sponsors per page view.
// ListingBott holds one of the spots like any sponsor.
export default function InlineSponsor({ as: Tag = 'li' }: { as?: 'li' | 'div' }) {
  const inline = useLiveAds().filter(a => a.kind === 'inline');
  const pick = useMemo(() => Math.random(), []);
  const pool = [HOUSE_AD, ...inline];
  const ad = pool[Math.floor(pick * pool.length)];
  return (
    <Tag className="list-none">
      <a
        href={ad.url}
        target="_blank"
        rel="sponsored noopener"
        className="-mx-2 flex items-center gap-x-3 rounded-lg bg-orange-500/[0.04] px-2 py-2.5 ring-1 ring-inset ring-orange-500/15 duration-150 hover:bg-slate-800/50"
      >
        <img src={ad.logo_url ?? ''} alt="" className="h-8 w-8 flex-none rounded-lg bg-slate-800 object-cover ring-1 ring-slate-800" loading="lazy" />
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-medium text-slate-100">{ad.name}</span>
          <span className="text-slate-500"> · {ad.tagline}</span>
        </span>
        <span className="flex-none rounded border border-slate-700 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-slate-500">Sponsored</span>
      </a>
    </Tag>
  );
}
