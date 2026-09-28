import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import FunnelReport from './FunnelReport';
import AdsReport from './AdsReport';
import ModerationReport from './ModerationReport';
import { isAdmin } from '@/utils/server/admin';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

type Counts = { pageviews: number; visitors: number; new_visitors: number };
interface Analytics {
  daily?: ({ day: string } & Counts)[];
  hourly?: ({ hour: string } & Counts)[]; // 24h view (get_analytics_hourly)
  tracking_since?: string | null; // first hour with hourly counts
  countries: { country: string; pageviews: number; visitors: number }[];
  pages: { path: string; pageviews: number }[];
  unique_visitors_all_time: number;
}

const RANGES = [1, 7, 30, 90]; // days; 1 = last 24 hours, hour by hour
const fmt = (n: number) => Number(n).toLocaleString('en-US');
const countryName = (code: string) => {
  if (code === 'XX') return 'Unknown';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
};
const flag = (code: string) => (code === 'XX' ? '🌐' : String.fromCodePoint(0x1f1a5 + code.charCodeAt(0), 0x1f1a5 + code.charCodeAt(1)));

// Internal: first-party page views, unique visitors and countries (DevHunt team only).
export default async function AnalyticsPage({ searchParams }: { searchParams: { days?: string } }) {
  if (!(await isAdmin())) notFound();
  const days = RANGES.includes(Number(searchParams?.days)) ? Number(searchParams.days) : 30;
  const hourly = days === 1;
  const { data } = hourly
    ? await serviceClient.rpc('get_analytics_hourly' as never)
    : await serviceClient.rpc('get_analytics' as never, { _days: days } as never);
  const a = data as unknown as Analytics | null;
  if (!a) return <p className="mt-20 text-center text-slate-400">Couldn&apos;t load analytics.</p>;

  // One slot per day (or per hour in the 24h view), so the bars keep their width while data is sparse.
  const empty: Counts = { pageviews: 0, visitors: 0, new_visitors: 0 };
  let slots: (Counts & { key: string; label: string; tick: string; noData?: boolean })[];
  if (hourly) {
    const byHour = new Map((a.hourly ?? []).map(h => [new Date(h.hour).toISOString().slice(0, 13), h]));
    const now = new Date();
    now.setUTCMinutes(0, 0, 0);
    // Hourly counting started on deploy (2026-09-28): earlier hours have no data, not zero visits.
    const since = a.tracking_since ? Date.parse(a.tracking_since) : now.getTime();
    slots = Array.from({ length: 24 }, (_, i) => {
      const t = now.getTime() - (23 - i) * 3600000;
      const at = new Date(t).toISOString();
      const key = at.slice(0, 13);
      return { ...(byHour.get(key) ?? empty), key, label: `${at.slice(0, 10)} ${at.slice(11, 13)}:00 UTC`, tick: `${at.slice(11, 13)}:00`, noData: t < since };
    });
  } else {
    const byDay = new Map((a.daily ?? []).map(d => [d.day, d]));
    slots = Array.from({ length: days }, (_, i) => {
      const day = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
      return { ...(byDay.get(day) ?? empty), key: day, label: day, tick: day.slice(5) };
    });
  }
  const hasData = slots.some(d => Number(d.pageviews));
  const missing = slots.filter(d => d.noData).length;
  const partial = hourly && missing > 0 && a.tracking_since ? `since ${new Date(a.tracking_since).toISOString().slice(11, 16)} UTC` : null;
  const total = (key: keyof Counts) => slots.reduce((sum, d) => sum + Number(d[key]), 0);
  const maxDay = Math.max(1, ...slots.map(d => Number(d.visitors)));
  const maxCountry = Math.max(1, ...a.countries.map(c => Number(c.visitors)));
  const maxPage = Math.max(1, ...a.pages.map(p => Number(p.pageviews)));
  const tiles = [
    { label: 'unique_visitors', value: total('visitors'), hint: partial ? `sum of hourly uniques, ${partial}` : `sum of ${hourly ? 'hourly' : 'daily'} uniques` },
    { label: 'new_visitors', value: total('new_visitors'), hint: 'first visit ever' },
    { label: 'page_views', value: total('pageviews'), hint: `${(total('pageviews') / Math.max(1, total('visitors'))).toFixed(1)} per visitor` },
    { label: 'all_time_visitors', value: a.unique_visitors_all_time, hint: 'since launch' },
  ];

  return (
    <section className="container-custom-screen mt-10 mb-20">
      <PageHeader eyebrow="Internal" title="Analytics">
        First-party page views, visitors, countries, the submit funnel, sponsor ads and moderation. Counted without cookies; bots and automated browsers are skipped.
      </PageHeader>

      <nav className="mt-6 flex gap-2 font-mono text-xs">
        {RANGES.map(r => (
          <a
            key={r}
            href={`?days=${r}`}
            className={`rounded-full border px-3 py-1 ${r === days ? 'border-slate-500 text-slate-100' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}
          >
            {r === 1 ? '24h' : `${r}d`}
          </a>
        ))}
      </nav>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 font-mono sm:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="bg-slate-900 px-4 py-4">
            <dt className="text-[11px] text-slate-500">{t.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-50">{fmt(t.value)}</dd>
            <dd className="mt-1 text-[11px] text-slate-500">{t.hint}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12">
        <SectionLabel title={`Unique visitors per ${hourly ? 'hour' : 'day'}`} hint={hourly ? 'last 24 hours, UTC' : `last ${days} days, UTC`} />
        {hasData ? (
          <>
          <div className="mt-4 flex h-40 items-end gap-[2px]" role="img" aria-label={`Unique visitors per ${hourly ? 'hour' : 'day'}`}>
            {slots.map(d => (
              <div key={d.key} className="group relative flex h-full flex-1 items-end">
                {d.noData ? (
                  <div className="h-full w-full rounded-t-[4px] border border-dashed border-slate-800/80" />
                ) : (
                  <div
                    className={`w-full rounded-t-[4px] ${Number(d.visitors) ? 'bg-orange-400/80 group-hover:bg-orange-300' : 'bg-slate-800'}`}
                    style={{ height: `${Math.max(1, (Number(d.visitors) / maxDay) * 100)}%` }}
                  />
                )}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 group-hover:block">
                  <div className="text-slate-500">{d.label}</div>
                  {d.noData ? 'no data: hourly counting started later' : `${fmt(d.visitors)} visitors · ${fmt(d.pageviews)} views · ${fmt(d.new_visitors)} new`}
                </div>
              </div>
            ))}
          </div>
          {/* Axis: a few labels so it's clear what one bar is. */}
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-600">
            {[0, Math.floor(slots.length / 4), Math.floor(slots.length / 2), Math.floor((slots.length * 3) / 4), slots.length - 1].map(i => (
              <span key={i}>{slots[i]?.tick}</span>
            ))}
          </div>
          {partial && (
            <p className="mt-2 font-mono text-[11px] text-slate-500">
              Hourly counting started {new Date(a.tracking_since!).toISOString().slice(0, 16).replace('T', ' ')} UTC; the dashed hours before that have no data. The
              24h numbers above only cover the time {partial}.
            </p>
          )}
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No data yet. Visits are counted from now on{hourly ? ' (hourly counts started on Sep 29, 2026)' : ''}.</p>
        )}
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div>
          <SectionLabel title="Countries" hint="by unique visitors" />
          <ul className="mt-4 space-y-1 text-sm">
            {a.countries.map(c => (
              <li key={c.country} className="relative -mx-2 flex items-center justify-between rounded-md px-2 py-1.5">
                <span className="absolute inset-y-0 left-0 rounded-md bg-slate-800/70" style={{ width: `${(Number(c.visitors) / maxCountry) * 100}%` }} />
                <span className="relative truncate text-slate-200">
                  {flag(c.country)} {countryName(c.country)}
                </span>
                <span className="relative font-mono text-xs text-slate-400">{fmt(c.visitors)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionLabel title="Top pages" hint={hourly ? 'by page views, today and yesterday' : 'by page views'} />
          <ul className="mt-4 space-y-1 text-sm">
            {a.pages.map(p => (
              <li key={p.path} className="relative -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1.5">
                <span className="absolute inset-y-0 left-0 rounded-md bg-slate-800/70" style={{ width: `${(Number(p.pageviews) / maxPage) * 100}%` }} />
                <Link href={p.path} className="relative truncate font-mono text-xs text-slate-200 hover:text-white">
                  {p.path}
                </Link>
                <span className="relative font-mono text-xs text-slate-400">{fmt(p.pageviews)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <FunnelReport days={days} />
      <AdsReport days={days} />
      <ModerationReport days={days} />
    </section>
  );
}
