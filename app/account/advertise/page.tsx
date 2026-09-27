'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { AD_PRICE_USD } from '@/utils/ads';

const INVOICE_URL = 'https://zenvoice.io/p/65d6370232047df47b4c142b';
const NAME_MAX = 24;
const TAGLINE_MAX = 70;

type Draft = { id: number; url: string; name: string; tagline: string; logo_url: string | null };
type MyAd = Draft & { slot: number | null; status: string; current_period_end: string | null; started_at: string | null; created_at: string };
type Payment = { id: string; ad: string; amount: number; currency: string; status: string | null; date: string };

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'live', cls: 'text-green-400' },
  canceling: { label: 'canceled, live until period end', cls: 'text-amber-400' },
  ended: { label: 'ended', cls: 'text-slate-500' },
  blocked: { label: "can't run", cls: 'text-red-400' },
};

function Preview({ ad }: { ad: Pick<Draft, 'name' | 'tagline' | 'logo_url'> }) {
  return (
    <div className="flex h-44 w-52 flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-center">
      {ad.logo_url ? (
        <img src={ad.logo_url} alt="" className="h-10 w-10 rounded-lg bg-slate-800 object-cover" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 font-bold">{ad.name[0]}</span>
      )}
      <span className="mt-2 text-sm font-semibold text-slate-100">{ad.name || 'Name'}</span>
      <span className="mt-1 line-clamp-3 font-mono text-[11px] leading-snug text-slate-400">{ad.tagline || 'Your headline'}</span>
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
  const [url, setUrl] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState<'' | 'draft' | 'pay' | number>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mine, setMine] = useState<{ ads: MyAd[]; payments: Payment[] } | null>(null);

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
    setDraft(null);
    setBusy('draft');
    const res = await fetch('/api/ads/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
    const d = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) return setError(d.error ?? 'Something went wrong.');
    if (d.blocked) return setBlocked(true);
    setDraft(d.ad);
  }

  async function pay() {
    if (!draft) return;
    setError('');
    setBusy('pay');
    const res = await fetch('/api/ads/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: draft.id, name: draft.name, tagline: draft.tagline }) });
    const d = await res.json().catch(() => ({}));
    if (d.url) return (window.location.href = d.url);
    setBusy('');
    if (d.blocked) return setBlocked(true), setDraft(null);
    setError(d.error ?? 'Could not start the payment.');
  }

  async function cancel(ad: MyAd, resume = false) {
    if (!resume && !confirm(`Cancel ${ad.name}? It stays live until ${fmt(ad.current_period_end)} and won't renew.`)) return;
    setBusy(ad.id);
    await fetch('/api/ads/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: ad.id, resume }) });
    setBusy('');
    load();
  }

  return (
    <section className="container-custom-screen mb-20 mt-10">
      <PageHeader eyebrow="Advertise" title="Put your product in front of developers">
        A sponsor card next to every page on DevHunt (a pill on mobile). ${AD_PRICE_USD}/month, cancel anytime. Enter your URL and we'll write the ad for you.
      </PageHeader>

      {notice && <p className="mt-6 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">{notice}</p>}

      <form onSubmit={generate} className="mt-8 flex gap-2">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="yourproduct.com"
          required
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
        />
        <button disabled={busy === 'draft'} className="flex-none rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-60">
          {busy === 'draft' ? 'Writing your ad…' : 'Generate ad'}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {blocked && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          Sorry, we can't run this ad. DevHunt doesn't accept ads for crypto, gambling, adult content or anything that looks deceptive. If you think this is a mistake, email john@marsx.dev.
        </p>
      )}

      {draft && (
        <div className="mt-8 flex flex-col gap-6 sm:flex-row">
          <Preview ad={draft} />
          <div className="flex-1 space-y-3">
            <label className="block text-sm text-slate-400">
              Name
              <input value={draft.name} maxLength={NAME_MAX} onChange={e => setDraft({ ...draft, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
            </label>
            <label className="block text-sm text-slate-400">
              Headline <span className="font-mono text-xs text-slate-600">{draft.tagline.length}/{TAGLINE_MAX}</span>
              <input value={draft.tagline} maxLength={TAGLINE_MAX} onChange={e => setDraft({ ...draft, tagline: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
            </label>
            <p className="font-mono text-xs text-slate-500">Links to {draft.url}</p>
            <button onClick={pay} disabled={busy === 'pay'} className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-60">
              {busy === 'pay' ? 'Opening checkout…' : `Pay $${AD_PRICE_USD}/month and go live`}
            </button>
          </div>
        </div>
      )}

      {!!mine?.ads.length && (
        <div className="mt-14">
          <h2 className="text-lg font-semibold text-slate-100">Your ads</h2>
          <ul className="mt-3 divide-y divide-slate-800">
            {mine.ads.map(ad => (
              <li key={ad.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100">
                    {ad.name} <span className="text-slate-500">· {ad.tagline}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    <span className={STATUS[ad.status]?.cls}>{STATUS[ad.status]?.label ?? ad.status}</span>
                    {ad.slot ? ` · slot ${ad.slot}` : ''}
                    {ad.status === 'active' && ad.current_period_end ? ` · renews ${fmt(ad.current_period_end)}` : ''}
                    {ad.status === 'canceling' ? ` · ends ${fmt(ad.current_period_end)}` : ''}
                  </p>
                </div>
                {ad.status === 'active' && (
                  <button onClick={() => cancel(ad)} disabled={busy === ad.id} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-red-500/60 hover:text-red-300">
                    Cancel subscription
                  </button>
                )}
                {ad.status === 'canceling' && (
                  <button onClick={() => cancel(ad, true)} disabled={busy === ad.id} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500">
                    Resume
                  </button>
                )}
              </li>
            ))}
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
