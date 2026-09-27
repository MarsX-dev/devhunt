'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import AdPlacement from '@/components/ui/Sponsors/AdPlacement';
import { AD_KINDS, AD_PRODUCTS, REFUND_DAYS, isAdKind, spotsLeft, type AdKind } from '@/utils/ads';

const INVOICE_URL = 'https://zenvoice.io/p/65d6370232047df47b4c142b';
const NAME_MAX = 24;
const TAGLINE_MAX = 70;
const DESCRIPTION_MAX = 220;

type Draft = { id: number; kind: AdKind; url: string; name: string; tagline: string; description: string | null; logo_url: string | null; image_url: string | null };
type MyAd = Draft & {
  group: number | null; // ads bought in one checkout share a subscription
  slot: number | null;
  status: string;
  current_period_end: string | null;
  refundable_until: string | null;
  refunded_at: string | null;
  created_at: string;
};
type Payment = { id: string; ad: string; amount: number; currency: string; status: string | null; date: string };

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'live', cls: 'text-green-400' },
  canceling: { label: 'canceled, live until period end', cls: 'text-amber-400' },
  ended: { label: 'ended', cls: 'text-slate-500' },
  blocked: { label: "can't run", cls: 'text-red-400' },
};

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

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdvertisePage />
    </Suspense>
  );
}

function AdvertisePage() {
  const params = useSearchParams();
  // ?product=rail or ?product=rail,inline,newsletter (from the pitch page)
  const initial = (params?.get('product') ?? '').split(',').filter(isAdKind);
  const [kinds, setKinds] = useState<AdKind[]>(initial.length ? AD_KINDS.filter(k => initial.includes(k)) : ['rail']);
  const [url, setUrl] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const draft = drafts[0] ?? null; // the copy is shared by every ad type picked
  const setDraft = (d: Draft) => setDrafts(all => all.map(a => ({ ...a, name: d.name, tagline: d.tagline, description: d.description })));
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState<'' | 'draft' | 'pay' | number>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mine, setMine] = useState<{ ads: MyAd[]; payments: Payment[]; free?: Record<AdKind, number> } | null>(null);

  const load = useCallback(() => {
    fetch('/api/ads/mine')
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setMine(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sessionId = params?.get('session_id');
    if (params?.get('canceled')) setNotice('Payment canceled. Your ad was not started.');
    if (!sessionId) return load();
    fetch(`/api/ads/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(d => setNotice(d.status === 'no-slot' ? 'Paid, but every slot was just taken. We were notified and will sort it out or refund you.' : 'Payment received. Your ad is live!'))
      .finally(load);
  }, [params, load]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBlocked(false);
    setDrafts([]);
    if (!kinds.length) return setError('Pick at least one ad type.');
    setBusy('draft');
    const d = await post('/api/ads/draft', { url, kinds });
    setBusy('');
    if (!d.ok) return setError(d.error ?? 'Something went wrong.');
    if (d.blocked) return setBlocked(true);
    setDrafts(d.ads);
  }

  async function pay() {
    if (!draft) return;
    setError('');
    setBusy('pay');
    if (!picked.length) return setBusy(''), setError('Switch on at least one ad type.');
    const d = await post('/api/ads/checkout', { adIds: picked.map(a => a.id), name: draft.name, tagline: draft.tagline, description: draft.description ?? '' });
    if (d.url) return (window.location.href = d.url);
    setBusy('');
    if (d.blocked) {
      setBlocked(true);
      return setDrafts([]);
    }
    setError(d.error ?? 'Could not start the payment.');
  }

  async function manage(ad: MyAd, action: 'cancel' | 'resume' | 'refund') {
    const ask = {
      cancel: `Cancel ${ad.name}? Everything bought in the same checkout stays live until ${fmt(ad.current_period_end)} and won't renew.`,
      refund: `Cancel ${ad.name} now and refund your last payment? Everything bought in the same checkout comes down right away.`,
      resume: '',
    }[action];
    if (ask && !confirm(ask)) return;
    setBusy(ad.id);
    const d = await post('/api/ads/cancel', { adId: ad.id, resume: action === 'resume', refund: action === 'refund' });
    setBusy('');
    if (!d.ok) alert(d.error ?? 'Something went wrong.');
    else if (action === 'refund') setNotice(`Refunded $${((d.refunded ?? 0) / 100).toFixed(2)}. It can take 5-10 days to show on your card.`);
    load();
  }

  const soldOut = (k: AdKind) => mine?.free?.[k] === 0;
  const toggle = (k: AdKind) => setKinds(ks => (ks.includes(k) ? ks.filter(x => x !== k) : AD_KINDS.filter(x => x === k || ks.includes(x))));
  // Switching a card off after generating just leaves it out of the checkout.
  const picked = drafts.filter(d => kinds.includes(d.kind));
  const missing = draft ? kinds.filter(k => !drafts.some(d => d.kind === k)) : [];
  const input = 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

  return (
    <section className="container-custom-screen mb-20 mt-10">
      <PageHeader eyebrow="Advertise" title="Your ads">
        Switch on the ad types you want, enter your URL and we'll write the ads. Monthly, cancel anytime, full refund within {REFUND_DAYS} days of a payment.{' '}
        <Link href="/advertise" className="text-orange-400 hover:text-orange-300">
          Audience and pricing →
        </Link>
      </PageHeader>

      {notice && <p className="mt-6 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">{notice}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
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
                  <p className="mt-0.5 font-mono text-xs text-slate-400">{soldOut(k) ? 'sold out' : `$${p.price}/month${p.per ? ` · ${p.per}` : ''}`}</p>
                  {mine?.free && !soldOut(k) && <p className="mt-0.5 font-mono text-[11px] text-orange-300">{spotsLeft(k, mine.free[k])}</p>}
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
          {picked.some(d => d.kind === 'newsletter') && (
            <label className="block text-sm text-slate-400">
              Newsletter description <span className="font-mono text-xs text-slate-600">{(draft.description ?? '').length}/{DESCRIPTION_MAX}</span>
              <textarea value={draft.description ?? ''} maxLength={DESCRIPTION_MAX} rows={2} onChange={e => setDraft({ ...draft, description: e.target.value })} className={input} />
            </label>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button onClick={pay} disabled={busy === 'pay' || !picked.length} className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-60">
              {busy === 'pay' ? 'Opening checkout…' : `Pay $${picked.reduce((sum, d) => sum + AD_PRODUCTS[d.kind].price, 0)}/month and go live`}
            </button>
            <span className="font-mono text-xs text-slate-500">
              {picked.length > 1 ? `${picked.length} ads, one subscription · ` : ''}links to {draft.url}
            </span>
          </div>
        </div>
      )}

      {!!mine?.ads.length && (
        <div className="mt-14">
          <h2 className="text-lg font-semibold text-slate-100">Your ads</h2>
          <ul className="mt-3 divide-y divide-slate-800">
            {mine.ads.map((ad, i) => {
              // Ads bought together share one subscription: show its buttons once, on the first row.
              const lead = !ad.group || mine.ads.findIndex(a => a.group === ad.group) === i;
              return (
              <li key={ad.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100">
                    {ad.name} <span className="text-slate-500">· {ad.tagline}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    {AD_PRODUCTS[ad.kind]?.title} · <span className={STATUS[ad.status]?.cls}>{STATUS[ad.status]?.label ?? ad.status}</span>
                    {ad.status === 'active' && ad.current_period_end ? ` · renews ${fmt(ad.current_period_end)}` : ''}
                    {ad.status === 'canceling' ? ` · ends ${fmt(ad.current_period_end)}` : ''}
                    {ad.refunded_at ? ` · refunded ${fmt(ad.refunded_at)}` : ''}
                  </p>
                </div>
                {lead && ad.status === 'active' && (
                  <button onClick={() => manage(ad, 'cancel')} disabled={busy === ad.id} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500">
                    Cancel subscription
                  </button>
                )}
                {lead && ad.status === 'canceling' && (
                  <button onClick={() => manage(ad, 'resume')} disabled={busy === ad.id} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500">
                    Resume
                  </button>
                )}
                {lead && ad.refundable_until && (
                  <button
                    onClick={() => manage(ad, 'refund')}
                    disabled={busy === ad.id}
                    title={`Available until ${fmt(ad.refundable_until)}`}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-red-500/60 hover:text-red-300"
                  >
                    Cancel and refund
                  </button>
                )}
              </li>
              );
            })}
          </ul>
        </div>
      )}

      {!!mine?.payments.length && (
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Payment history</h2>
            <a href={INVOICE_URL} target="_blank" rel="noopener" className="text-sm text-orange-400 hover:text-orange-300">
              Download invoices ↗
            </a>
          </div>
          <table className="mt-3 w-full text-left text-sm">
            <tbody className="divide-y divide-slate-800">
              {mine.payments.map(p => (
                <tr key={p.id} className="text-slate-300">
                  <td className="py-2 font-mono text-xs text-slate-500">{fmt(p.date)}</td>
                  <td className="py-2">{p.ad}</td>
                  <td className="py-2 font-mono tabular-nums">${p.amount.toFixed(2)}</td>
                  <td className="py-2 font-mono text-xs text-slate-500">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
