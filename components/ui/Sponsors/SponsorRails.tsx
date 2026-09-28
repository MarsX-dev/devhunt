'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useImpression } from './track';
import { AD_PRICE_USD, AD_SLOTS, spotsLeft, type PublicAd } from '@/utils/ads';

type LiveAd = PublicAd & { freeFrom: string | null };
type Card = { ad: LiveAd | null; slot: number; freeFrom?: string | null };

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// One request per page view, answered by the CDN (see /api/ads/slots); shared by rails, strip and inline ads.
let request: Promise<LiveAd[]> | null = null;
export function useLiveAds() {
  const [ads, setAds] = useState<LiveAd[]>([]);
  useEffect(() => {
    request ??= fetch('/api/ads/slots')
      .then(r => (r.ok ? r.json() : { ads: [] }))
      .then(d => (d.ads ?? []) as LiveAd[])
      .catch(() => []);
    request.then(setAds);
  }, []);
  return ads;
}

// No ads where they're noise or don't belong: /advertise (it already shows every slot), everything
// under /account (a signed-in user's own pages, admin pages included), internal tools and login.
const NO_ADS = /^\/(advertise|account|email-sponsor-ad|login|auth)(\/|$)/;
const useHidden = () => NO_ADS.test(usePathname() ?? '');

function useSponsors() {
  const ads = useLiveAds().filter(a => a.kind === 'rail');
  // Slots 1..6, filled or open; odd ones on the left, even on the right.
  const cards: Card[] = [];
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
      <Link href="/advertise" className="group flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 p-3 text-center opacity-40 duration-150 hover:border-orange-500/60 hover:opacity-100">
        <span className="font-mono text-[10px] tracking-[0.25em] text-slate-500">OPEN SLOT</span>
        <span className="mt-2 text-lg font-bold text-slate-100">
          ${AD_PRICE_USD}
          <span className="font-mono text-[11px] font-normal text-slate-500">/mo</span>
        </span>
        <span className="mt-2 font-mono text-[11px] text-slate-400 group-hover:text-orange-400">your tool here {side === 'l' ? '←' : '→'}</span>
      </Link>
    );
  return <PaidCard ad={ad} freeFrom={card.freeFrom} />;
}

function PaidCard({ ad, freeFrom }: { ad: PublicAd; freeFrom?: string | null }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useImpression(ref, ad.id);
  return (
    <div className="relative">
    <a
      ref={ref}
      href={ad.url}
      target="_blank"
      rel="sponsored noopener"
      className="relative flex h-44 flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-center duration-150 hover:border-slate-500 hover:bg-slate-800"
    >
      <Logo ad={ad} className="h-10 w-10" />
      <span className="mt-2 text-sm font-semibold text-slate-100">{ad.name}</span>
      <span className="mt-1 line-clamp-3 font-mono text-[11px] leading-snug text-slate-400">{ad.tagline}</span>
    </a>
    {freeFrom && (
      <Link href="/advertise" className="absolute inset-x-0 bottom-1.5 text-center font-mono text-[10px] text-slate-500 hover:text-orange-400">
        free from {shortDate(freeFrom)}
      </Link>
    )}
    </div>
  );
}

// The rails wait for the page to finish loading (plus a beat), then slide in, so they never compete with
// the content for the first paint. Once per full page load: the rails live in the root layout, so on
// client navigation (or coming back from a page without ads) they're simply there.
const REVEAL_DELAY_MS = 800;
let revealed = false;
type RevealState = 'hidden' | 'animate' | 'static';
function useReveal(): RevealState {
  const [state, setState] = useState<RevealState>(revealed ? 'static' : 'hidden');
  useEffect(() => {
    if (revealed) return;
    let timer: number | undefined;
    const go = () => {
      timer = window.setTimeout(() => {
        revealed = true;
        setState('animate');
      }, REVEAL_DELAY_MS);
    };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
    return () => {
      window.removeEventListener('load', go);
      window.clearTimeout(timer);
    };
  }, []);
  return state;
}

// Slides in from its side and fades in, staggered per card; no motion with prefers-reduced-motion.
const slideIn = { l: 'motion-safe:animate-[railin-l_600ms_cubic-bezier(0.16,1,0.3,1)_both]', r: 'motion-safe:animate-[railin-r_600ms_cubic-bezier(0.16,1,0.3,1)_both]' };
const REVEAL_KEYFRAMES =
  '@keyframes railin-l{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}@keyframes railin-r{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}';
function Reveal({ state, side, order, children }: { state: RevealState; side: 'l' | 'r'; order: number; children: ReactNode }) {
  if (state !== 'animate') return <>{children}</>;
  return (
    <div className={slideIn[side]} style={{ animationDelay: `${order * 120}ms` }}>
      {children}
    </div>
  );
}

// Side gutters: 3 cards each from 1000px (below that, a scrolling pill strip on top: SponsorStrip).
// From 1000 to 1179px the page content is narrowed to make room (see the wrapper in app/layout.tsx) and
// the cards are 112px wide; from 1180px they grow into the natural gutters.
export default function SponsorRails() {
  const { cards, left } = useSponsors();
  const reveal = useReveal();
  if (useHidden() || reveal === 'hidden') return null;
  // Absolute columns the height of the page content; the inner stack is sticky, so it follows the
  // scroll but never runs into the footer.
  const rail =
    'pointer-events-none absolute inset-y-0 z-20 hidden w-28 pt-6 min-[1000px]:block min-[1180px]:w-[min(220px,calc((100vw-56rem)/2-2rem))]';
  const stack = 'pointer-events-auto sticky top-20 flex flex-col gap-3';
  return (
    <>
      <div className={`${rail} left-3 min-[1180px]:left-4`}>
        <div className={stack}>
          {[0, 2, 4].map((i, order) => (
            <Reveal key={i} state={reveal} side="l" order={order}>
              <RailCard card={cards[i]} side="l" />
            </Reveal>
          ))}
        </div>
      </div>
      <div className={`${rail} right-3 min-[1180px]:right-4`}>
        <div className={stack}>
          {[1, 3, 5].map((i, order) => (
            <Reveal key={i} state={reveal} side="r" order={order}>
              <RailCard card={cards[i]} side="r" />
            </Reveal>
          ))}
          {left > 0 && (
            <Reveal state={reveal} side="r" order={3}>
              <p className="text-center font-mono text-[10px] text-slate-500">{spotsLeft('rail', left)}</p>
            </Reveal>
          )}
        </div>
      </div>
      {reveal === 'animate' && <style>{REVEAL_KEYFRAMES}</style>}
    </>
  );
}

function Pill({ ad }: { ad: PublicAd }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useImpression(ref, ad.id);
  return (
    <a ref={ref} href={ad.url} target="_blank" rel="sponsored noopener" className="flex flex-none items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-sm font-semibold text-slate-100">
      <Logo ad={ad} className="h-5 w-5 !rounded-md text-[10px]" />
      {ad.name}
    </a>
  );
}

export function SponsorStrip() {
  const { cards } = useSponsors();
  if (useHidden()) return null;
  const pills = [...cards, ...cards]; // doubled for a seamless loop
  return (
    <div className="overflow-hidden border-b border-slate-800 bg-slate-950 py-2 min-[1000px]:hidden">
      <div className="flex w-max gap-2 px-2 motion-safe:animate-[sponsorstrip_45s_linear_infinite] hover:[animation-play-state:paused]">
        {pills.map(({ ad }, i) =>
          ad ? (
            <Pill key={i} ad={ad} />
          ) : (
            <Link key={i} href="/advertise" className="flex flex-none items-center rounded-lg border border-dashed border-slate-600 px-3 py-1.5 font-mono text-xs text-slate-400 opacity-50 hover:opacity-100">
              your tool here · ${AD_PRICE_USD}/mo
            </Link>
          ),
        )}
      </div>
      <style>{'@keyframes sponsorstrip{to{transform:translateX(-50%)}}'}</style>
    </div>
  );
}
