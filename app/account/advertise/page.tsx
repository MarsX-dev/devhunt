'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import AdStats from '@/components/ui/Sponsors/AdStats';
import { AD_PRODUCTS, REFUND_DAYS, isRecurring, planPrice, type AdKind, type AdPlan } from '@/utils/ads';

const INVOICE_URL = 'https://zenvoice.io/p/65d6370232047df47b4c142b';

type MyAd = { id: number; kind: AdKind; url: string; name: string; tagline: string; description: string | null; logo_url: string | null; image_url: string | null;
  plan: AdPlan;
  editions_left: number | null;
  started_at: string | null;
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

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdvertisePage />
    </Suspense>
  );
}

function AdvertisePage() {
  const params = useSearchParams();
  const [busy, setBusy] = useState<'' | number>('');
  const [notice, setNotice] = useState('');
  const [justPaid, setJustPaid] = useState(false);
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
      .then(d => (d.status === 'no-slot' ? setNotice('Paid, but a slot was just taken by someone else. We were notified and will sort it out or refund you.') : setJustPaid(true)))
      .finally(load);
  }, [params, load]);

  async function manage(ad: MyAd, action: 'cancel' | 'resume' | 'refund') {
    const ask = {
      cancel: `Cancel future months for ${ad.name}?\n\nThis only stops future charges. You've paid for the current month, so your ads (everything bought in the same checkout) stay live until ${fmt(ad.current_period_end)}, then stop. Nothing is refunded; for a refund use "Cancel and refund" within ${REFUND_DAYS} days of a payment.`,
      refund: `Cancel ${ad.name} now and refund your last payment?\n\nThe ads come down right away and nothing renews.`,
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

  // The purchase that just came back from Stripe: the most recently started ads.
  const latest = mine?.ads.filter(a => a.started_at && ['active', 'canceling'].includes(a.status)).sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))[0];
  const latestGroup = latest ? mine!.ads.filter(a => (latest.group ? a.group === latest.group : a.id === latest.id)) : [];
  const latestMonthly = latestGroup.filter(a => isRecurring(a.kind, a.plan) && a.status !== 'ended');

  return (
    <section className="container-custom-screen mb-20 mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Advertise" title="Your ads">
          Your sponsor ads, how they perform, and your payments. Cancel future months or get a refund here.
        </PageHeader>
        <Link href="/advertise" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400">
          New ad
        </Link>
      </div>

      {notice && <p className="mt-6 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">{notice}</p>}
      {justPaid && latest && (
        <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 p-5 text-sm text-slate-300">
          <p className="text-base font-semibold text-slate-50">Payment received. Your ads are live 🎉</p>
          {latestMonthly.length ? (
            <>
              <p className="mt-2">
                You&apos;re on a <b className="text-slate-100">monthly plan</b>: ${latestMonthly.reduce((sum, a) => sum + planPrice(a.kind), 0)}/month, next charge on{' '}
                <b className="text-slate-100">{fmt(latestMonthly[0].current_period_end)}</b>.
              </p>
              <p className="mt-1 text-slate-400">
                Only want this month? Cancel future months now: it stops the renewal, and this month (already paid) keeps running until {fmt(latestMonthly[0].current_period_end)}.
              </p>
              {latestMonthly[0].status === 'active' ? (
                <button onClick={() => manage(latestMonthly[0], 'cancel')} disabled={busy === latestMonthly[0].id} className="mt-3 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-400">
                  Cancel future months
                </button>
              ) : (
                <p className="mt-3 font-mono text-xs text-amber-300">Future months canceled. Runs until {fmt(latestMonthly[0].current_period_end)}, no more charges.</p>
              )}
            </>
          ) : (
            <p className="mt-2">One-time payment, nothing renews. Your ad goes out in the next weekly newsletter.</p>
          )}
        </div>
      )}

      {mine && !mine.ads.length && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
          <p className="text-slate-300">No ads yet.</p>
          <Link href="/advertise" className="mt-4 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400">
            Create your first ad
          </Link>
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
                    {ad.plan === 'single' ? (ad.editions_left ? ' · 1 edition, goes out in the next email' : ' · edition sent') : ''}
                    {ad.plan !== 'single' && ad.status === 'active' && ad.current_period_end ? ` · renews ${fmt(ad.current_period_end)}` : ''}
                    {ad.status === 'canceling' ? ` · ends ${fmt(ad.current_period_end)}` : ''}
                    {ad.refunded_at ? ` · refunded ${fmt(ad.refunded_at)}` : ''}
                  </p>
                </div>
                {lead && ad.status === 'active' && ad.plan !== 'single' && (
                  <button onClick={() => manage(ad, 'cancel')} disabled={busy === ad.id} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500">
                    Cancel future months
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

      {!!mine?.ads.some(a => a.started_at) && <AdStats ads={mine.ads.filter(a => a.started_at).map(a => ({ id: a.id, name: a.name, kind: a.kind }))} />}

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
