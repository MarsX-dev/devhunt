'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useImpression } from './track';
import { AD_PRODUCTS, INLINE_MAX_OPEN, type PublicAd } from '@/utils/ads';
import { useLiveAds } from './SponsorRails';

const row = '-mx-2 flex items-center gap-x-3 rounded-lg px-2 py-2.5 duration-150 hover:bg-slate-800/50';

function Sponsored({ ad }: { ad: PublicAd }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useImpression(ref, ad.id);
  return (
    <a ref={ref} href={ad.url} target="_blank" rel="sponsored noopener" className={`${row} bg-orange-500/[0.04] ring-1 ring-inset ring-orange-500/15`}>
      <img src={ad.logo_url ?? ''} alt="" className="h-8 w-8 flex-none rounded-lg bg-slate-800 object-cover ring-1 ring-slate-800" loading="lazy" />
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium text-slate-100">{ad.name}</span>
        <span className="text-slate-500"> · {ad.tagline}</span>
      </span>
      <span className="flex-none rounded border border-slate-700 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-slate-500">Sponsored</span>
    </a>
  );
}

// One random offset per page view, so the sponsor rows on a page rotate through the inline ads.
const offset = Math.floor(Math.random() * 1000);

// Native ad row in tool lists (same columns as ToolRow). Placed with sponsorBefore() from utils/ads:
// `n` is the row's ordinal in its list, `list` tells lists on the same page apart (e.g. upcoming weeks),
// so neighbouring rows show different sponsors. While none is sold: an open spot linking to /advertise,
// at most INLINE_MAX_OPEN per list.
export default function InlineSponsor({
  as: Tag = 'li',
  n = 0,
  list = 0,
  className = '',
}: {
  as?: 'li' | 'div';
  n?: number;
  list?: number;
  className?: string;
}) {
  const inline = useLiveAds().filter(a => a.kind === 'inline');
  const ad = inline.length ? inline[(offset + list + n) % inline.length] : null;
  if (!ad && n >= INLINE_MAX_OPEN) return null;
  return (
    <Tag className={`list-none ${className}`}>
      {ad ? (
        <Sponsored ad={ad} />
      ) : (
        <Link
          href="/advertise?product=inline&ref=open-inline"
          className={`${row} border border-dashed border-slate-700 opacity-60 hover:border-orange-500/60 hover:opacity-100`}
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-dashed border-slate-600 text-slate-500">
            +
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-400">your ad here · ${AD_PRODUCTS.inline.price}/mo</span>
          <span className="flex-none font-mono text-[10px] uppercase tracking-wider text-slate-500">open spot</span>
        </Link>
      )}
    </Tag>
  );
}
