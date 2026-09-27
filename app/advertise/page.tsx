import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { AD_KINDS, AD_PRODUCTS, AUDIENCE, HOUSE_AD, REFUND_DAYS, spotsLeft, type AdKind } from '@/utils/ads';
import { availability } from '@/utils/server/ads';
import { formatStat, getSiteStats, DOMAIN_RATING } from '@/utils/siteStats';
import AdPlacement from '@/components/ui/Sponsors/AdPlacement';

// Public pitch for sponsors; buying happens on /account/advertise. Rebuilt every 10 minutes.
export const revalidate = 600;

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

function Mock({ kind }: { kind: AdKind }) {
  if (kind === 'rail')
    return (
      <div className="flex h-28 w-24 flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-center">
        <img src={HOUSE_AD.logo_url!} alt="" className="h-6 w-6 rounded" />
        <span className="mt-1.5 text-[11px] font-semibold text-slate-100">Your tool</span>
        <span className="mt-0.5 font-mono text-[9px] leading-tight text-slate-500">your headline here</span>
      </div>
    );
  if (kind === 'inline')
    return (
      <div className="w-full space-y-1 text-[11px]">
        <div className="h-5 rounded bg-slate-800/60" />
        <div className="flex h-6 items-center gap-2 rounded bg-orange-500/[0.06] px-2 ring-1 ring-orange-500/20">
          <span className="h-3.5 w-3.5 rounded bg-slate-600" />
          <span className="font-medium text-slate-200">Your tool</span>
          <span className="truncate text-slate-500">· your headline</span>
          <span className="ml-auto font-mono text-[8px] uppercase text-slate-500">Sponsored</span>
        </div>
        <div className="h-5 rounded bg-slate-800/60" />
      </div>
    );
  return (
    <div className="w-full rounded-lg bg-white p-2 text-[10px] text-slate-700">
      <div className="h-8 rounded bg-slate-200" />
      <p className="mt-1.5 font-semibold text-slate-900">Your tool: your headline</p>
      <p className="text-slate-500">A sentence or two about what it does.</p>
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
        DevHunt is where developers come to find new tools. Sponsor a spot on the site or in the weekly newsletter. Monthly, cancel anytime, full refund within {REFUND_DAYS} days of a payment.
      </PageHeader>

      <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 sm:grid-cols-4">
        {numbers.map(n => (
          <div key={n.label} className="bg-slate-900 p-4">
            <p className="text-2xl font-semibold tabular-nums text-slate-50">{n.value}</p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">{n.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {AD_KINDS.map(kind => {
          const p = AD_PRODUCTS[kind];
          const left = free?.[kind];
          return (
            <div key={kind} className="flex flex-col rounded-2xl border border-slate-800 p-5">
              <div className="flex h-32 items-center justify-center rounded-xl bg-slate-950 p-4">
                <Mock kind={kind} />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-slate-50">{p.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{p.pitch}</p>
              <AdPlacement kind={kind} className="mt-2 self-start" />
              <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
                {p.where.map(w => (
                  <li key={w} className="flex gap-2">
                    <span className="text-orange-400">✓</span>
                    {w}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <p className="text-2xl font-semibold text-slate-50">
                  ${p.price}
                  <span className="font-mono text-xs font-normal text-slate-500">/month{p.per ? ` · ${p.per}` : ''}</span>
                </p>
                <p className={`mt-1 font-mono text-xs ${left === 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  {spotsLeft(kind, left ?? p.slots)}
                </p>
                {left === 0 ? (
                  <span className="mt-4 block rounded-lg border border-slate-700 py-2.5 text-center text-sm text-slate-500">Sold out</span>
                ) : (
                  <Link href={`/account/advertise?product=${kind}`} className="mt-4 block rounded-lg bg-orange-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-400">
                    Get started
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {free && AD_KINDS.every(k => free[k] > 0) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/5 px-5 py-4">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-slate-100">Want all three?</span> Pick several ad types in one go: one ad, one checkout, one monthly subscription.
          </p>
          <Link href={`/account/advertise?product=${AD_KINDS.join(',')}`} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400">
            Get all three · ${AD_KINDS.reduce((sum, k) => sum + AD_PRODUCTS[k].price, 0)}/mo
          </Link>
        </div>
      )}

      <h2 className="mt-16 text-xl font-semibold text-slate-50">Who visits DevHunt</h2>
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
