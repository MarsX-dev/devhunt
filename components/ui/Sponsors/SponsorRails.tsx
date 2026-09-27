'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AD_PRICE_USD, AD_SLOTS, HOUSE_AD, type PublicAd } from '@/utils/ads';

type LiveAd = PublicAd & { freeFrom: string | null };
type Card = { ad: LiveAd | PublicAd | null; slot: number; freeFrom?: string | null };

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function useSponsors() {
  const [ads, setAds] = useState<LiveAd[]>([]);
  useEffect(() => {
    fetch('/api/ads/slots')
      .then(r => (r.ok ? r.json() : { ads: [] }))
      .then(d => setAds(d.ads ?? []))
      .catch(() => {});
  }, []);
  // House ad first, then slots 1..5 (filled or open).
  const cards: Card[] = [{ ad: HOUSE_AD, slot: 0 }];
  for (let s = 1; s <= AD_SLOTS; s++) {
    const ad = ads.find(a => a.slot === s) ?? null;
    cards.push({ ad, slot: s, freeFrom: ad?.freeFrom });
  }
  return { cards, left: AD_SLOTS - ads.length };
}

const Logo = ({ ad, className }: { ad: PublicAd; className: string }) =>
  ad.logo_url ? (
    <img src={ad.logo_url} alt="" className={`${className} flex-none rounded-lg bg-slate-800 object-cover`} loading="lazy" />
  ) : (
    <span className={`${className} flex flex-none items-center justify-center rounded-lg bg-slate-700 font-bold text-slate-100`}>{ad.name[0]}</span>
  );

function RailCard({ card, side }: { card: Card; side: 'l' | 'r' }) {
  const { ad } = card;
  if (!ad)
    return (
      <Link href="/account/advertise" className="group flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 p-3 text-center duration-150 hover:border-orange-500/60">
        <span className="font-mono text-[10px] tracking-[0.25em] text-slate-500">OPEN SLOT</span>
        <span className="mt-2 text-lg font-bold text-slate-100">
          ${AD_PRICE_USD}
          <span className="font-mono text-[11px] font-normal text-slate-500">/mo</span>
        </span>
        <span className="mt-2 font-mono text-[11px] text-slate-400 group-hover:text-orange-400">your tool here {side === 'l' ? '←' : '→'}</span>
      </Link>
    );
  return (
    <div className="relative">
    <a
      href={ad.url}
      target="_blank"
      rel="sponsored noopener"
      className="relative flex h-44 flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-center duration-150 hover:border-slate-500 hover:bg-slate-800"
    >
      <Logo ad={ad} className="h-10 w-10" />
      <span className="mt-2 text-sm font-semibold text-slate-100">{ad.name}</span>
      <span className="mt-1 line-clamp-3 font-mono text-[11px] leading-snug text-slate-400">{ad.tagline}</span>
    </a>
    {card.freeFrom && (
      <Link href="/account/advertise" className="absolute inset-x-0 bottom-1.5 text-center font-mono text-[10px] text-slate-500 hover:text-orange-400">
        free from {shortDate(card.freeFrom)}
      </Link>
    )}
    </div>
  );
}

// Desktop: 3 cards in each side gutter (from 1180px). Below that, a scrolling pill strip on top.
export default function SponsorRails() {
  const { cards, left } = useSponsors();
  const rail = 'fixed top-20 z-20 hidden w-[min(220px,calc((100vw-56rem)/2-2rem))] flex-col gap-3 min-[1180px]:flex';
  return (
    <>
      <div className={`${rail} left-4`}>
        {[0, 2, 4].map(i => (
          <RailCard key={i} card={cards[i]} side="l" />
        ))}
      </div>
      <div className={`${rail} right-4`}>
        {[1, 3, 5].map(i => (
          <RailCard key={i} card={cards[i]} side="r" />
        ))}
        {left > 0 && <p className="text-center font-mono text-[10px] text-slate-500">{left} of {AD_SLOTS} slots left</p>}
      </div>
    </>
  );
}

export function SponsorStrip() {
  const { cards } = useSponsors();
  const pills = [...cards, ...cards]; // doubled for a seamless loop
  return (
    <div className="overflow-hidden border-b border-slate-800 bg-slate-950 py-2 min-[1180px]:hidden">
      <div className="flex w-max gap-2 px-2 motion-safe:animate-[sponsorstrip_45s_linear_infinite] hover:[animation-play-state:paused]">
        {pills.map(({ ad }, i) =>
          ad ? (
            <a key={i} href={ad.url} target="_blank" rel="sponsored noopener" className="flex flex-none items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-sm font-semibold text-slate-100">
              <Logo ad={ad} className="h-5 w-5 !rounded-md text-[10px]" />
              {ad.name}
            </a>
          ) : (
            <Link key={i} href="/account/advertise" className="flex flex-none items-center rounded-lg border border-dashed border-slate-600 px-3 py-1.5 font-mono text-xs text-slate-400">
              your tool here · ${AD_PRICE_USD}/mo
            </Link>
          ),
        )}
      </div>
      <style>{'@keyframes sponsorstrip{to{transform:translateX(-50%)}}'}</style>
    </div>
  );
}
