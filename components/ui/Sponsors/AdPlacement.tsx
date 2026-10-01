'use client';

import { useEffect, useState } from 'react';
import { AD_PRODUCTS, planLabel, weeklyPlan, type AdKind } from '@/utils/ads';

// "See where it shows": a sketch of the page with the ad's spot highlighted, for the advertise pages.
// Given the advertiser's generated ad, the sketch shows that ad in its spot instead of a placeholder.
export type AdLook = { name: string; tagline: string; description?: string | null; logo_url: string | null; image_url?: string | null };

const Logo = ({ ad, className }: { ad: AdLook; className: string }) =>
  ad.logo_url ? (
    <img src={ad.logo_url} alt="" className={`flex-none rounded bg-slate-800 object-cover ${className}`} />
  ) : (
    <span className={`flex flex-none items-center justify-center rounded bg-orange-400 text-[8px] font-bold text-white ${className}`}>{ad.name[0]}</span>
  );

const Hi = 'bg-orange-500/25 ring-1 ring-orange-400';
const Bar = ({ w = 'w-full', className = '' }: { w?: string; className?: string }) => <div className={`h-1.5 rounded bg-slate-700/70 ${w} ${className}`} />;

function Browser({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
      <div className="flex items-center gap-1 border-b border-slate-800 px-2 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
        <span className="ml-2 h-2.5 flex-1 rounded bg-slate-800" />
      </div>
      {children}
    </div>
  );
}
function Phone({ children }: { children: React.ReactNode }) {
  return <div className="w-28 flex-none overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-950 p-1">{children}</div>;
}
const Nav = () => (
  <div className="flex items-center justify-between px-2 py-1.5">
    <Bar w="w-8" />
    <Bar w="w-10" />
  </div>
);
const Row = ({ hi, label, ad }: { hi?: boolean; label?: string; ad?: AdLook }) =>
  hi && ad ? (
    <div className={`flex items-center gap-1.5 rounded px-1.5 py-1 ${Hi}`}>
      <Logo ad={ad} className="h-4 w-4" />
      <span className="min-w-0 flex-1 truncate text-[9px] leading-tight text-slate-100">
        <b className="font-semibold">{ad.name}</b> <span className="text-slate-400">· {ad.tagline}</span>
      </span>
      <span className="font-mono text-[7px] uppercase text-orange-300">{label}</span>
    </div>
  ) : (
  <div className={`flex items-center gap-1.5 rounded px-1.5 py-1 ${hi ? Hi : ''}`}>
    <span className={`h-2.5 w-2.5 flex-none rounded-sm ${hi ? 'bg-orange-400' : 'bg-slate-700'}`} />
    <Bar w={hi ? 'w-1/3' : 'w-1/2'} className={hi ? '!bg-orange-300/70' : ''} />
    {label && <span className="ml-auto font-mono text-[7px] uppercase text-orange-300">{label}</span>}
  </div>
);

function RailSketch({ ad }: { ad?: AdLook }) {
  const card = (hi = false) =>
    hi && ad ? (
      <div className={`flex h-12 flex-col items-center justify-center gap-0.5 overflow-hidden rounded px-0.5 text-center ${Hi}`}>
        <Logo ad={ad} className="h-4 w-4" />
        <span className="w-full truncate text-[7px] font-semibold leading-none text-slate-100">{ad.name}</span>
      </div>
    ) : (
      <div className={`${ad ? 'h-12' : 'h-9'} rounded ${hi ? Hi : 'border border-dashed border-slate-700'}`} />
    );
  const side = ad ? 'w-14' : 'w-10';
  return (
    <div className="flex items-end gap-4">
      <div className="flex-1">
        <p className="mb-1.5 font-mono text-[10px] text-slate-500">Desktop and laptop</p>
        <Browser>
          <Nav />
          <div className="flex gap-2 p-2">
            <div className={`${side} space-y-1.5`}>
              {card(true)}
              {card()}
              {card()}
            </div>
            <div className="flex-1 space-y-1.5 py-1">
              <Bar w="w-2/3" className="h-3" />
              <Bar w="w-1/2" />
              {Array.from({ length: 6 }, (_, i) => (
                <Row key={i} />
              ))}
            </div>
            <div className={`${side} space-y-1.5`}>
              {card()}
              {card()}
              {card()}
            </div>
          </div>
        </Browser>
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10px] text-slate-500">Phone and tablet</p>
        <Phone>
          <Nav />
          <div className="flex gap-1 overflow-hidden px-1 pb-1">
            {ad ? (
              <span className={`flex h-3 w-8 flex-none items-center justify-center rounded ${Hi}`}>
                <Logo ad={ad} className="h-2 w-2" />
              </span>
            ) : (
              <span className={`h-3 w-8 flex-none rounded ${Hi}`} />
            )}
            <span className="h-3 w-8 flex-none rounded bg-slate-800" />
            <span className="h-3 w-8 flex-none rounded bg-slate-800" />
          </div>
          <div className="space-y-1 p-1">
            <Bar w="w-2/3" className="h-2.5" />
            {Array.from({ length: 7 }, (_, i) => (
              <Row key={i} />
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}

function InlineSketch({ ad }: { ad?: AdLook }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-1.5 font-mono text-[10px] text-slate-500">Home page: this week&apos;s launches</p>
        <Browser>
          <Nav />
          <div className="space-y-1 p-2">
            <Bar w="w-2/3" className="h-3" />
            <Row />
            <Row />
            <Row />
            <Row hi label="sponsored" ad={ad} />
            <Row />
            <Row />
          </div>
        </Browser>
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10px] text-slate-500">Tool pages, categories, upcoming, all tools</p>
        <Browser>
          <Nav />
          <div className="space-y-1 p-2">
            <Bar w="w-2/3" className="h-3" />
            {Array.from({ length: 3 }, (_, i) => (
              <Row key={i} />
            ))}
            <Row hi label="sponsored" ad={ad} />
            <Row />
            <Row />
          </div>
        </Browser>
      </div>
    </div>
  );
}

function NewsletterSketch({ ad }: { ad?: AdLook }) {
  return (
    <div className="mx-auto max-w-xs">
      <p className="mb-1.5 font-mono text-[10px] text-slate-500">The weekly email, in the inbox</p>
      <div className="space-y-1.5 rounded-lg bg-white p-3">
        <div className="mx-auto h-2 w-12 rounded bg-slate-300" />
        {ad ? (
          <div className={`space-y-1 rounded p-1.5 ${Hi}`}>
            {(ad.image_url || ad.logo_url) && <img src={(ad.image_url || ad.logo_url)!} alt="" className="max-h-16 w-full rounded object-cover" />}
            <p className="text-[10px] font-semibold leading-tight text-slate-900">
              {ad.name}: {ad.tagline}
            </p>
            <p className="line-clamp-2 text-[9px] leading-tight text-slate-600">{ad.description || ad.tagline}</p>
            <p className="text-[9px] font-medium text-orange-600">Learn More ›</p>
          </div>
        ) : (
          <div className={`space-y-1 rounded p-1.5 ${Hi}`}>
            <div className="h-10 rounded bg-orange-300/60" />
            <div className="h-1.5 w-3/4 rounded bg-orange-400/80" />
            <div className="h-1.5 w-full rounded bg-orange-300/60" />
            <div className="h-1.5 w-1/4 rounded bg-orange-400/80" />
          </div>
        )}
        <div className="h-2 w-1/2 rounded bg-slate-300" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-slate-200" />
            <div className="h-1.5 flex-1 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// What an advertiser gets, in plain words, next to the sketch.
export const PLACEMENT_DETAILS: Record<AdKind, string[]> = {
  rail: [
    'Shown on every public page of DevHunt: the home page, every tool page, category lists, the blog, comparisons and more.',
    'On desktop and laptop (82% of visitors) the cards sit on both sides of the content and stay in view while people scroll.',
    'On phones and tablets they become a scrolling strip of logos just under the header.',
    'Only 6 spots, never rotated: your card is on screen for the whole week or month you book.',
  ],
  inline: [
    'A row inside the tool lists, styled like the launches around it and marked "Sponsored".',
    'On the home page it sits right after this week\'s top 3 launches, the most-read spot on the site.',
    'It also runs in the other tool lists: trending launches on every tool page, category pages ("Best AI tools", ...), upcoming launches, all tools, alternatives and more.',
    'Long lists repeat it: after the 3rd tool, then every 8 tools.',
    'Only 6 sponsors share the inline spots; they rotate between the rows on a page.',
  ],
  newsletter: [
    'The weekly DevHunt email goes to 40,000 developers. You sponsor one edition, or 4 (one every week for the month).',
    'Your ad is the first thing in the email, above the tools of the week: a banner image, headline, short description and a button.',
    'Only one sponsor per email, so you never share the spot.',
    'We build the banner from your site\'s preview image; you can edit the text before paying.',
  ],
};

export default function AdPlacement({ kind, ad, className = '' }: { kind: AdKind; ad?: AdLook | null; className?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1 text-xs text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-orange-300 ${className}`}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
          <path d="M1.5 5.5h13M4 8.5h3v3H4z" />
        </svg>
        See where it shows
      </button>
      {open && (
        // Clicks must not reach the (clickable) card the button sits in.
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={e => {
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div role="dialog" aria-label={`Where the ${AD_PRODUCTS[kind].title} shows`} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-50">{AD_PRODUCTS[kind].title}</h3>
                <p className="font-mono text-xs text-slate-500">
                  {planLabel(kind, weeklyPlan(kind))} or ${AD_PRODUCTS[kind].price}/month · {ad ? 'your ad' : 'the ad spot'} is highlighted in orange
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded px-2 text-xl leading-none text-slate-500 hover:text-slate-200" aria-label="Close">
                ×
              </button>
            </div>
            <div className="mt-5">{kind === 'rail' ? <RailSketch ad={ad ?? undefined} /> : kind === 'inline' ? <InlineSketch ad={ad ?? undefined} /> : <NewsletterSketch ad={ad ?? undefined} />}</div>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              {PLACEMENT_DETAILS[kind].map(d => (
                <li key={d} className="flex gap-2">
                  <span className="text-orange-400">•</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
