'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSupabase } from '@/components/supabase/provider';
import { GithubProvider, GoogleProvider } from '@/components/ui/AuthProviderButtons';
import AdPlacement from '@/components/ui/Sponsors/AdPlacement';
import ProgressTerminal from '@/components/ui/ProgressTerminal';
import { PENDING_KEY, type PendingAd } from '@/components/ui/Sponsors/AdResume';
import fileUploader from '@/utils/supabase/fileUploader';
import { trackStep } from '@/utils/funnelClient';
import { AD_KINDS, AD_PRODUCTS, REFUND_HOURS, isAdKind, isRecurring, monthlySaving, planPrice, spotsLeft, viewsEstimate, weeklyPlan, type AdKind, type AdPlan } from '@/utils/ads';

// The ad builder at the top of /advertise: enter a URL, all three ads get written, switch on the ones
// to buy (right column), edit, pay. Anyone can fill it in; signing in is asked for at "Generate", and the choices survive
// the OAuth round trip (localStorage), after which it generates straight away.
const NAME_MAX = 24;
const TAGLINE_MAX = 70;
const DESCRIPTION_MAX = 220;

const AD_STEPS = ['fetching your website', 'reading what it does', 'writing your headline', 'writing the newsletter copy', 'grabbing your logo and banner', 'checking the ad can run'];

type Draft = { id: number; kind: AdKind; url: string; name: string; tagline: string; description: string | null; logo_url: string | null; image_url: string | null };

const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));

function Preview({ ad }: { ad: Draft }) {
  const logo = ad.logo_url ? (
    <img src={ad.logo_url} alt="" className="h-10 w-10 flex-none rounded-lg bg-slate-800 object-cover" />
  ) : (
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-slate-700 font-bold">{ad.name[0]}</span>
  );
  if (ad.kind === 'rail')
    return (
      <div className="mx-auto flex w-full max-w-[13rem] flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-center">
        {logo}
        <span className="mt-2 text-sm font-semibold text-slate-100">{ad.name || 'Name'}</span>
        <span className="mt-1 line-clamp-3 font-mono text-[11px] leading-snug text-slate-400">{ad.tagline || 'Your headline'}</span>
      </div>
    );
  if (ad.kind === 'inline')
    return (
      <div className="w-full">
        <div className="flex items-center gap-x-2 rounded-lg bg-orange-500/[0.04] px-2 py-2.5 ring-1 ring-inset ring-orange-500/15">
          <span className="[&>*]:!h-8 [&>*]:!w-8">{logo}</span>
          {/* Two lines here: the card is narrower than a real list row. */}
          <span className="line-clamp-2 min-w-0 flex-1 text-xs leading-snug">
            <span className="font-medium text-slate-100">{ad.name}</span>
            <span className="text-slate-500"> · {ad.tagline}</span>
          </span>
          <span className="flex-none rounded border border-slate-700 px-1 py-px font-mono text-[9px] uppercase text-slate-500">Ad</span>
        </div>
      </div>
    );
  return (
    <div className="w-full rounded-lg bg-white p-3 text-slate-700">
      {ad.image_url || ad.logo_url ? <img src={ad.image_url || ad.logo_url!} alt="" className="max-h-28 w-full rounded object-cover" /> : null}
      <p className="mt-2 text-sm font-semibold text-slate-900">
        {ad.name}: {ad.tagline}
      </p>
      <p className="mt-1 text-xs text-slate-600">{ad.description || ad.tagline}</p>
      <p className="mt-1.5 text-xs font-medium text-orange-600">Learn More ›</p>
    </div>
  );
}


// Current image with a button to upload a new one.
export function ImagePick({ label, hint, src, busy, onPick, onRemove, square }: { label: string; hint: string; src: string | null; busy: boolean; onPick: (f?: File) => void; onRemove?: () => void; square?: boolean }) {
  return (
    <div className="min-w-0 text-sm text-slate-400">
      {label} <span className="font-mono text-xs text-slate-600">{hint}</span>
      <div className="mt-1 flex items-center gap-2">
        <div className={`flex flex-none items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-800 ${square ? 'h-12 w-12' : 'h-12 w-20'}`}>
          {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <span className="font-mono text-[10px] text-slate-500">none</span>}
        </div>
        <label className={`cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-500 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          {busy ? 'Uploading…' : src ? 'Change' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={e => {
              onPick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {src && onRemove && (
          <button type="button" onClick={onRemove} className="text-lg leading-none text-slate-500 hover:text-slate-300" aria-label={`Remove ${label.toLowerCase()}`} title="Remove">
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Grows with its content instead of scrolling.
function AutoTextarea({ value, onChange, maxLength, className }: { value: string; onChange: (v: string) => void; maxLength: number; className: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`; // + the borders
  }, [value]);
  return <textarea ref={ref} rows={2} value={value} maxLength={maxLength} onChange={e => onChange(e.target.value)} className={className} />;
}

function SignIn({ onClose }: { onClose: () => void }) {
  const { supabase } = useSupabase();
  const [load, setLoad] = useState<'' | 'github' | 'google'>('');
  const go = async (provider: 'github' | 'google') => {
    setLoad(provider);
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/advertise` } });
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-label="Sign in" className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-50">Sign in to write your ads</h3>
        <p className="mt-1 text-sm text-slate-400">One click. You&apos;ll come right back here with everything you picked, and we&apos;ll generate your ads.</p>
        <GithubProvider isLoad={load === 'github'} onClick={() => go('github')} className="mt-6" />
        <GoogleProvider isLoad={load === 'google'} onClick={() => go('google')} />
      </div>
    </div>
  );
}

export default function AdBuilder({ free }: { free: Record<AdKind, number> | null }) {
  const params = useSearchParams();
  const { session, loading } = useSupabase();
  // ?product=rail or ?product=rail,inline,newsletter
  const initial = (params?.get('product') ?? '').split(',').filter(isAdKind);
  const [kinds, setKinds] = useState<AdKind[]>(initial.length ? AD_KINDS.filter(k => initial.includes(k)) : ['rail']);
  const [url, setUrl] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const draft = drafts[0] ?? null; // the copy is shared by every ad type picked
  const setDraft = (d: Draft) =>
    setDrafts(all => all.map(a => ({ ...a, name: d.name, tagline: d.tagline, description: d.description, url: d.url, logo_url: d.logo_url, image_url: d.image_url })));
  const [uploading, setUploading] = useState<'' | 'logo_url' | 'image_url'>('');
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState<'' | 'draft' | 'pay'>('');
  const [error, setError] = useState('');
  const [monthlyKinds, setMonthlyKinds] = useState<AdKind[]>([]); // the rest are bought for a week (the default)
  const [signIn, setSignIn] = useState(false);
  const resumed = useRef(false);

  // Opened /advertise (where from: ?ref= on our own "your ad here" links, else the previous page).
  useEffect(() => {
    let from: string | undefined;
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.host === location.host) from = ref.pathname;
    } catch {}
    trackStep('ad_view', { product: params?.get('product') ?? undefined, from });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate(e?: React.FormEvent, state = { url, kinds }) {
    e?.preventDefault();
    setError('');
    setBlocked(false);
    if (e) trackStep('ad_generate_click', { url: state.url, kinds: state.kinds, signed_in: !!session?.user });
    if (!session?.user) {
      trackStep('ad_signin_prompt', { url: state.url, kinds: state.kinds });
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify({ url: state.url, kinds: state.kinds, monthly: monthlyKinds, at: Date.now() } satisfies PendingAd));
      } catch {}
      return setSignIn(true);
    }
    setDrafts([]);
    setBusy('draft');
    const d = await post('/api/ads/draft', { url: state.url, kinds: AD_KINDS }); // all three: switching one on later needs no new run
    setBusy('');
    if (!d.ok) return setError(d.error ?? 'Something went wrong.');
    if (d.blocked) return setBlocked(true);
    setDrafts(d.ads);
  }

  // Back from sign-in: restore the choices and generate right away.
  useEffect(() => {
    if (loading || resumed.current) return;
    resumed.current = true;
    let pending: PendingAd | null = null;
    try {
      pending = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
      localStorage.removeItem(PENDING_KEY);
    } catch {}
    if (!pending || Date.now() - pending.at > 30 * 60_000) return;
    setUrl(pending.url);
    setKinds(pending.kinds.filter(isAdKind));
    setMonthlyKinds((pending.monthly ?? []).filter(isAdKind));
    if (session?.user && pending.url) void generate(undefined, { url: pending.url, kinds: pending.kinds.filter(isAdKind) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session]);

  async function pay() {
    if (!draft) return;
    setError('');
    if (!picked.length) return setError('Switch on at least one ad type.');
    setBusy('pay');
    const d = await post('/api/ads/checkout', {
      adIds: picked.map(a => a.id),
      name: draft.name,
      tagline: draft.tagline,
      description: draft.description ?? '',
      url: draft.url,
      logoUrl: draft.logo_url,
      imageUrl: draft.image_url,
      plans: Object.fromEntries(picked.map(d => [d.kind, planOf(d.kind)])),
    });
    if (d.url) return (window.location.href = d.url);
    setBusy('');
    if (d.blocked) {
      setBlocked(true);
      return setDrafts([]);
    }
    setError(d.error ?? 'Could not start the payment.');
  }

  async function upload(field: 'logo_url' | 'image_url', file?: File) {
    if (!draft || !file) return;
    if (!file.type.startsWith('image/')) return setError('Please pick an image file.');
    setError('');
    setUploading(field);
    const res = await fileUploader({ files: file as any, options: field === 'logo_url' ? 'w=128' : 'w=600' });
    setUploading('');
    if (!res?.file) return setError('Upload failed, please try again.');
    setDraft({ ...draft, [field]: res.file });
  }

  const soldOut = (k: AdKind) => free?.[k] === 0;
  const toggle = (k: AdKind) => setKinds(ks => (ks.includes(k) ? ks.filter(x => x !== k) : AD_KINDS.filter(x => x === k || ks.includes(x))));
  // All three ads are written at once; the switches only decide what goes into the checkout.
  const picked = drafts.filter(d => kinds.includes(d.kind) && !soldOut(d.kind));
  const planOf = (k: AdKind): AdPlan => (monthlyKinds.includes(k) ? 'monthly' : weeklyPlan(k));
  const setPlan = (k: AdKind, plan: AdPlan) => {
    setMonthlyKinds(ms => (plan === 'monthly' ? [...ms.filter(x => x !== k), k] : ms.filter(x => x !== k)));
    if (!kinds.includes(k)) toggle(k);
  };
  const dueToday = picked.reduce((sum, d) => sum + planPrice(d.kind, planOf(d.kind)), 0);
  const monthly = picked.filter(d => isRecurring(d.kind, planOf(d.kind))).reduce((sum, d) => sum + planPrice(d.kind), 0);
  const input = 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';
  const host = (draft?.url ?? url).replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const startOver = () => {
    setDrafts([]);
    setBlocked(false);
    setError('');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10">
      {/* Left: website -> progress -> edit and pay */}
      <div className="min-w-0">
        {busy === 'draft' ? (
          <ProgressTerminal
            url={url}
            eyebrow={null}
            title="Writing your ads…"
            command="advertise"
            steps={AD_STEPS}
            footer="takes about 10 seconds · you can edit everything next"
            className=""
          />
        ) : !draft ? (
          <div className="rounded-2xl border border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-slate-50">Your website</h2>
            <p className="mt-1 text-sm text-slate-400">We read it and write all three ads for you.</p>
            <form onSubmit={generate} className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="yourproduct.com" required className={`${input} !mt-0 min-w-0 flex-1`} />
              <button className="flex-none rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-400">Write my ads</button>
            </form>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            {blocked && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                Sorry, we can&apos;t run this ad. DevHunt doesn&apos;t accept ads for crypto, gambling, adult content or anything that looks deceptive. If you think this is a mistake, email john@marsx.dev.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/[0.06] px-3.5 py-2 font-mono text-xs text-green-300">
              <button onClick={startOver} className="flex-none text-slate-400 hover:text-slate-200">
                ← back
              </button>
              <span className="min-w-0 truncate">✓ ads written from {host}</span>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-800 p-5">
              <p className="text-sm font-medium text-slate-200">Edit your ad</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                <label className="block text-sm text-slate-400">
                  Name
                  <input value={draft.name} maxLength={NAME_MAX} onChange={e => setDraft({ ...draft, name: e.target.value })} className={input} />
                </label>
                <label className="block text-sm text-slate-400">
                  Link
                  <input value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} placeholder="https://yourproduct.com" className={input} />
                </label>
              </div>
              <label className="block text-sm text-slate-400">
                Headline <span className="font-mono text-xs text-slate-600">{draft.tagline.length}/{TAGLINE_MAX}</span>
                <input value={draft.tagline} maxLength={TAGLINE_MAX} onChange={e => setDraft({ ...draft, tagline: e.target.value })} className={input} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <ImagePick label="Logo" hint="1:1" src={draft.logo_url} busy={uploading === 'logo_url'} onPick={f => void upload('logo_url', f)} square />
                {kinds.includes('newsletter') && (
                  <ImagePick
                    label="Banner"
                    hint="2:1"
                    src={draft.image_url}
                    busy={uploading === 'image_url'}
                    onPick={f => void upload('image_url', f)}
                    onRemove={() => setDraft({ ...draft, image_url: null })}
                  />
                )}
              </div>
              {kinds.includes('newsletter') && (
                <label className="block text-sm text-slate-400">
                  Newsletter text <span className="font-mono text-xs text-slate-600">{(draft.description ?? '').length}/{DESCRIPTION_MAX}</span>
                  <AutoTextarea value={draft.description ?? ''} maxLength={DESCRIPTION_MAX} onChange={v => setDraft({ ...draft, description: v })} className={`${input} resize-none overflow-hidden`} />
                </label>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 p-5">
              {picked.length ? (
                <ul className="space-y-1.5 text-sm">
                  {picked.map(d => (
                    <li key={d.kind} className="flex justify-between gap-3">
                      <span className="text-slate-300">
                        {AD_PRODUCTS[d.kind].title} <span className="text-slate-500">· {isRecurring(d.kind, planOf(d.kind)) ? 'monthly' : planOf(d.kind) === 'single' ? '1 edition' : '1 week'}</span>
                      </span>
                      <span className="font-mono text-slate-200">
                        ${planPrice(d.kind, planOf(d.kind))}
                        {isRecurring(d.kind, planOf(d.kind)) ? '/mo' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">Switch on at least one ad on the right.</p>
              )}
              <button
                onClick={pay}
                disabled={busy === 'pay' || !picked.length || !!uploading}
                className="mt-4 w-full rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-50"
              >
                {busy === 'pay' ? 'Opening checkout…' : picked.length ? `Pay $${dueToday} and go live` : 'Pick an ad'}
              </button>
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                {monthly ? (
                  <>
                    {dueToday !== monthly ? `$${dueToday} today, then ` : ''}${monthly}/month until you cancel.
                  </>
                ) : (
                  'One-time payment, nothing renews.'
                )}{' '}
                Not satisfied? Full refund within {REFUND_HOURS} hours for sidebar card and inline listing ads.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right: where to show it */}
      <div className="space-y-3 lg:sticky lg:top-24">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-slate-500">Where to show it</p>
        {AD_KINDS.map(k => {
          const p = AD_PRODUCTS[k];
          const on = kinds.includes(k) && !soldOut(k);
          const generated = drafts.find(d => d.kind === k);
          return (
            <div
              key={k}
              onClick={() => !soldOut(k) && toggle(k)}
              className={`cursor-pointer rounded-2xl border p-4 duration-150 ${on ? 'border-orange-500/70 bg-orange-500/[0.04]' : 'border-slate-800 hover:border-slate-600'} ${soldOut(k) ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-50">{p.title}</h3>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`Include ${p.title}`}
                  disabled={soldOut(k)}
                  onClick={e => {
                    e.stopPropagation();
                    toggle(k);
                  }}
                  className={`relative h-6 w-11 flex-none rounded-full duration-150 ${on ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow duration-150 ${on ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-3">
                <p className={`font-mono text-[11px] ${soldOut(k) ? 'text-slate-500' : 'text-orange-300'}`}>{free ? spotsLeft(k, free[k]) : ''}</p>
                <AdPlacement kind={k} ad={generated} />
              </div>
              {generated && on ? (
                <div className="relative mt-4" onClick={e => e.stopPropagation()}>
                  <Preview ad={generated} />
                  <span className="absolute -top-2.5 right-2 rounded-full bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-orange-200 ring-1 ring-orange-500/40">
                    {viewsEstimate(k, planOf(k))}
                  </span>
                </div>
              ) : (
                <ul className="mt-2 space-y-0.5 text-sm text-slate-400">
                  <li className="flex gap-1.5 text-orange-200">
                    <span className="text-orange-400">✓</span>
                    {viewsEstimate(k, planOf(k))}
                  </li>
                  {p.where.map(w => (
                    <li key={w} className="flex gap-1.5">
                      <span className="text-orange-400">✓</span>
                      {w}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-800/70 p-1 text-xs" onClick={e => e.stopPropagation()}>
                {(
                  [
                    [weeklyPlan(k), k === 'newsletter' ? '1 email' : '1 week', `$${planPrice(k, weeklyPlan(k))}`],
                    ['monthly', 'Monthly', `$${p.price} · -${monthlySaving(k)}%`],
                  ] as const
                ).map(([plan, label, price]) => (
                  <button
                    key={plan}
                    type="button"
                    disabled={soldOut(k)}
                    onClick={() => setPlan(k, plan)}
                    className={`truncate rounded-md px-2 py-1.5 text-left duration-150 ${planOf(k) === plan ? 'bg-slate-950 text-slate-50 ring-1 ring-orange-500/60' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <span className="font-medium">{label}</span> <span className="font-mono text-[10px] text-slate-500">{price}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {signIn && <SignIn onClose={() => setSignIn(false)} />}
    </div>
  );
}
