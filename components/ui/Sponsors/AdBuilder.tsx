'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSupabase } from '@/components/supabase/provider';
import { GithubProvider, GoogleProvider } from '@/components/ui/AuthProviderButtons';
import AdPlacement from '@/components/ui/Sponsors/AdPlacement';
import { PENDING_KEY, type PendingAd } from '@/components/ui/Sponsors/AdResume';
import fileUploader from '@/utils/supabase/fileUploader';
import { trackStep } from '@/utils/funnelClient';
import { AD_KINDS, AD_PRODUCTS, NEWSLETTER_SINGLE_PRICE, REFUND_DAYS, isAdKind, isRecurring, planLabel, planPrice, spotsLeft, type AdKind, type AdPlan } from '@/utils/ads';

// The ad builder at the top of /advertise: switch on ad types, enter a URL, get the ads written,
// edit, pay. Anyone can fill it in; signing in is asked for at "Generate", and the choices survive
// the OAuth round trip (localStorage), after which it generates straight away.
const NAME_MAX = 24;
const TAGLINE_MAX = 70;
const DESCRIPTION_MAX = 220;

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
      <div className="mx-auto flex h-44 w-full max-w-[13rem] flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-center">
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
    <div className="text-sm text-slate-400">
      {label} <span className="font-mono text-xs text-slate-600">{hint}</span>
      <div className="mt-1 flex items-center gap-3">
        <div className={`flex flex-none items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-800 ${square ? 'h-12 w-12' : 'h-12 w-24'}`}>
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
          <button type="button" onClick={onRemove} className="text-xs text-slate-500 hover:text-slate-300">
            Remove
          </button>
        )}
      </div>
    </div>
  );
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
  const [newsletterPlan, setNewsletterPlan] = useState<AdPlan>('monthly');
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
    if (!state.kinds.length) return setError('Pick at least one ad type.');
    if (e) trackStep('ad_generate_click', { url: state.url, kinds: state.kinds, signed_in: !!session?.user });
    if (!session?.user) {
      trackStep('ad_signin_prompt', { url: state.url, kinds: state.kinds });
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify({ url: state.url, kinds: state.kinds, newsletterPlan, at: Date.now() } satisfies PendingAd));
      } catch {}
      return setSignIn(true);
    }
    setDrafts([]);
    setBusy('draft');
    const d = await post('/api/ads/draft', { url: state.url, kinds: state.kinds });
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
    setNewsletterPlan(pending.newsletterPlan);
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
      plans: { newsletter: newsletterPlan },
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
  // Switching a card off after generating just leaves it out of the checkout.
  const picked = drafts.filter(d => kinds.includes(d.kind));
  const planOf = (k: AdKind): AdPlan => (k === 'newsletter' ? newsletterPlan : 'monthly');
  const dueToday = picked.reduce((sum, d) => sum + planPrice(d.kind, planOf(d.kind)), 0);
  const monthly = picked.filter(d => isRecurring(d.kind, planOf(d.kind))).reduce((sum, d) => sum + planPrice(d.kind), 0);
  const missing = draft ? kinds.filter(k => !drafts.some(d => d.kind === k)) : [];
  const input = 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {AD_KINDS.map(k => {
          const p = AD_PRODUCTS[k];
          const on = kinds.includes(k) && !soldOut(k);
          const generated = drafts.find(d => d.kind === k);
          return (
            <div
              key={k}
              onClick={() => !soldOut(k) && toggle(k)}
              className={`flex cursor-pointer flex-col rounded-2xl border p-5 duration-150 ${on ? 'border-orange-500/70 bg-orange-500/[0.04]' : 'border-slate-800 hover:border-slate-600'} ${soldOut(k) ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-50">{p.title}</h2>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">{soldOut(k) ? 'sold out' : planLabel(k, planOf(k))}</p>
                  {free && !soldOut(k) && <p className="mt-0.5 font-mono text-[11px] text-orange-300">{spotsLeft(k, free[k])}</p>}
                </div>
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
              <p className="mt-3 text-sm text-slate-400">{p.pitch}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                {p.where.map(w => (
                  <li key={w} className="flex gap-1.5">
                    <span className="text-orange-400">✓</span>
                    {w}
                  </li>
                ))}
              </ul>
              {k === 'newsletter' && (
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-800/70 p-1 text-xs" onClick={e => e.stopPropagation()}>
                  {(
                    [
                      ['monthly', '4 editions / month', `$${p.price} monthly`],
                      ['single', '1 edition', `$${NEWSLETTER_SINGLE_PRICE} once`],
                    ] as const
                  ).map(([plan, label, price]) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => {
                        setNewsletterPlan(plan);
                        if (!kinds.includes('newsletter')) toggle('newsletter');
                      }}
                      className={`rounded-md px-2 py-1.5 text-left duration-150 ${newsletterPlan === plan ? 'bg-slate-950 text-slate-50 ring-1 ring-orange-500/60' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <span className="block font-medium">{label}</span>
                      <span className="font-mono text-[10px] text-slate-500">{price}</span>
                    </button>
                  ))}
                </div>
              )}
              <AdPlacement kind={k} className="mt-3 self-start" />
              <div className={`mt-auto pt-5 ${on ? '' : 'opacity-40'}`}>
                {generated ? (
                  <Preview ad={generated} />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-700 px-3 text-center font-mono text-[11px] text-slate-500">
                    {!on ? 'switched off' : draft ? 'generate again to add this one' : 'your ad appears here'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={generate} className="mt-6 flex gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="yourproduct.com" required className={`${input} !mt-0 min-w-0 flex-1`} />
        <button disabled={busy === 'draft' || !kinds.length} className="flex-none rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-60">
          {busy === 'draft' ? 'Writing your ads…' : draft && !missing.length ? 'Regenerate' : kinds.length > 1 ? `Generate ${kinds.length} ads` : 'Generate ad'}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {blocked && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          Sorry, we can't run this ad. DevHunt doesn't accept ads for crypto, gambling, adult content or anything that looks deceptive. If you think this is a mistake, email john@marsx.dev.
        </p>
      )}

      {draft && (
        <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 p-5">
          <p className="text-sm text-slate-400">Edit the copy; every ad above updates as you type.</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <label className="block text-sm text-slate-400">
              Name
              <input value={draft.name} maxLength={NAME_MAX} onChange={e => setDraft({ ...draft, name: e.target.value })} className={input} />
            </label>
            <label className="block text-sm text-slate-400">
              Headline <span className="font-mono text-xs text-slate-600">{draft.tagline.length}/{TAGLINE_MAX}</span>
              <input value={draft.tagline} maxLength={TAGLINE_MAX} onChange={e => setDraft({ ...draft, tagline: e.target.value })} className={input} />
            </label>
          </div>
          <label className="block text-sm text-slate-400">
            Link
            <input value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} placeholder="https://yourproduct.com" className={input} />
          </label>
          <div className="flex flex-wrap gap-6">
            <ImagePick
              label="Logo"
              hint="square, shown on the cards"
              src={draft.logo_url}
              busy={uploading === 'logo_url'}
              onPick={f => void upload('logo_url', f)}
              square
            />
            {picked.some(d => d.kind === 'newsletter') && (
              <ImagePick
                label="Newsletter image"
                hint="wide, 2:1 works best"
                src={draft.image_url}
                busy={uploading === 'image_url'}
                onPick={f => void upload('image_url', f)}
                onRemove={() => setDraft({ ...draft, image_url: null })}
              />
            )}
          </div>
          {picked.some(d => d.kind === 'newsletter') && (
            <label className="block text-sm text-slate-400">
              Newsletter description <span className="font-mono text-xs text-slate-600">{(draft.description ?? '').length}/{DESCRIPTION_MAX}</span>
              <textarea value={draft.description ?? ''} maxLength={DESCRIPTION_MAX} rows={2} onChange={e => setDraft({ ...draft, description: e.target.value })} className={input} />
            </label>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button onClick={pay} disabled={busy === 'pay' || !picked.length || !!uploading} className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-60">
              {busy === 'pay' ? 'Opening checkout…' : monthly ? `Pay $${dueToday} and go live` : `Pay $${dueToday} once and go live`}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            {monthly ? (
              <>
                {dueToday !== monthly ? `$${dueToday} today, then ` : ''}
                <b className="text-slate-200">${monthly}/month, renews automatically</b>
                {picked.length > 1 ? ' (one subscription for everything you picked)' : ''}. You can cancel future months anytime, even right after paying: your ads keep
                running for the month you paid for. Full refund within {REFUND_DAYS} days of a payment.
              </>
            ) : (
              <>One-time payment, no subscription. Your ad goes out in the next weekly newsletter. Refundable until it&apos;s sent (within {REFUND_DAYS} days).</>
            )}
          </p>
        </div>
      )}

    {signIn && <SignIn onClose={() => setSignIn(false)} />}
    </div>
  );
}
