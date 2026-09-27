'use client';

import Link from 'next/link';
import { useMemo, useRef } from 'react';
import { useImpression } from './track';
import { AD_PRODUCTS, type PublicAd } from '@/utils/ads';
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

// Native ad row in tool lists (same columns as ToolRow): one of the inline sponsors per page view,
// or an open spot linking to /advertise while none is sold.
export default function InlineSponsor({ as: Tag = 'li' }: { as?: 'li' | 'div' }) {
  const inline = useLiveAds().filter(a => a.kind === 'inline');
  const pick = useMemo(() => Math.random(), []);
  const ad = inline.length ? inline[Math.floor(pick * inline.length)] : null;
  return (
    <Tag className="list-none">
      {ad ? (
        <Sponsored ad={ad} />
      ) : (
        <Link href="/advertise?product=inline" className={`${row} border border-dashed border-slate-700 hover:border-orange-500/60`}>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-dashed border-slate-600 text-slate-500">+</span>
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-400">your tool here · ${AD_PRODUCTS.inline.price}/mo</span>
          <span className="flex-none font-mono text-[10px] uppercase tracking-wider text-slate-500">open spot</span>
        </Link>
      )}
    </Tag>
  );
}
