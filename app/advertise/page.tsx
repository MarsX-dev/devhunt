import { Suspense } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import AdBuilder from '@/components/ui/Sponsors/AdBuilder';
import { AUDIENCE, REFUND_DAYS } from '@/utils/ads';
import { availability } from '@/utils/server/ads';
import { formatStat, getSiteStats, DOMAIN_RATING } from '@/utils/siteStats';

// Sponsors land straight in the ad builder; audience numbers below. Managing ads (stats, cancel,
// invoices) is /account/advertise. Rebuilt every minute so "spots left" stays current.
export const revalidate = 60;

export const metadata = {
  title: 'Advertise on DevHunt: reach developers',
  description: `Sponsor DevHunt: ${formatStat(AUDIENCE.pageViewsPerMonth)} page views a month and a weekly newsletter to ${formatStat(AUDIENCE.newsletterSubscribers)} developers.`,
  alternates: { canonical: '/advertise' },
};

function Bars({ title, rows }: { title: string; rows: { name: string; pct: number }[] }) {
  const max = Math.max(...rows.map(r => r.pct));
  return (
    <div className="rounded-2xl border border-slate-800 p-5">
      <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      <ul className="mt-4 space-y-2">
        {rows.map(r => (
          <li key={r.name} className="flex items-center gap-3 text-sm">
            <div className="relative h-7 flex-1 overflow-hidden rounded-md">
              <div className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-orange-500/5 to-orange-500/30" style={{ width: `${Math.max(4, (r.pct / max) * 100)}%` }} />
              <span className="relative flex h-full items-center px-2.5 text-slate-200">{r.name}</span>
            </div>
            <span className="w-10 flex-none text-right font-mono text-xs tabular-nums text-slate-400">{r.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdvertisePitch() {
  const [stats, free] = await Promise.all([getSiteStats(), availability().catch(() => null)]);
  const numbers = [
    { label: 'page views / month', value: formatStat(AUDIENCE.pageViewsPerMonth) },
    { label: 'avg. time on site', value: `${AUDIENCE.avgVisitMinutes} min` },
    { label: 'newsletter subscribers', value: formatStat(AUDIENCE.newsletterSubscribers) },
    { label: 'unique visitors since launch', value: stats ? formatStat(stats.unique_visitors) : '450K+' },
    { label: 'tool impressions', value: stats ? formatStat(stats.total_views) : '24M+' },
    { label: 'developers signed up', value: stats ? formatStat(stats.users) : '40K+' },
    { label: 'tools launched', value: stats ? formatStat(stats.tools_launched) : '7K+' },
    { label: 'domain rating (ahrefs)', value: DOMAIN_RATING },
  ];

  return (
    <section className="container-custom-screen mb-24 mt-10">
      <PageHeader eyebrow="Advertise" title="Put your product in front of developers">
        Switch on where you want to show up, enter your URL and we&apos;ll write the ads. Monthly, cancel anytime, full refund within {REFUND_DAYS} days of a payment.
      </PageHeader>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-slate-500">
        <span>
          <b className="font-medium text-slate-200">{formatStat(AUDIENCE.pageViewsPerMonth)}</b> page views / month
        </span>
        <span>
          <b className="font-medium text-slate-200">{formatStat(AUDIENCE.newsletterSubscribers)}</b> newsletter subscribers
        </span>
        <span>
          <b className="font-medium text-slate-200">{AUDIENCE.avgVisitMinutes} min</b> avg. visit
        </span>
        <a href="#audience" className="text-orange-400 hover:text-orange-300">
          full audience ↓
        </a>
      </p>

      <div className="mt-8">
        {/* useSearchParams (?product=) inside: needs a Suspense boundary on a static page. */}
        <Suspense fallback={<div className="h-[36rem] rounded-2xl border border-slate-800" />}>
          <AdBuilder free={free} />
        </Suspense>
      </div>

      <h2 id="audience" className="mt-20 scroll-mt-20 text-xl font-semibold text-slate-50">Who you reach</h2>
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 sm:grid-cols-4">
        {numbers.map(n => (
          <div key={n.label} className="bg-slate-900 p-4">
            <p className="text-2xl font-semibold tabular-nums text-slate-50">{n.value}</p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">{n.label}</p>
          </div>
        ))}
      </div>


      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Bars title="Country" rows={AUDIENCE.countries} />
        <Bars title="Device" rows={AUDIENCE.devices} />
      </div>

      <div className="mt-16 grid gap-6 text-sm text-slate-400 sm:grid-cols-3">
        <div>
          <h3 className="font-semibold text-slate-100">We write the ad</h3>
          <p className="mt-1">Enter your URL. We read your site and draft the name, headline and copy. You can edit it before paying.</p>
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">Live right away</h3>
          <p className="mt-1">Your ad goes live as soon as the payment clears. Crypto, gambling, adult and deceptive products aren&apos;t accepted.</p>
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">Cancel or refund anytime</h3>
          <p className="mt-1">Cancel from your account and the ad runs until the paid month ends. Changed your mind? Full refund within {REFUND_DAYS} days of a payment.</p>
        </div>
      </div>
    </section>
  );
}
