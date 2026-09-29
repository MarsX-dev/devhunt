import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import { AUDIENCE } from '@/utils/ads';
import { DOMAIN_RATING } from '@/utils/siteStats';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// Public open-stats page: the last 30 days (fixed range) from first-party analytics, plus all-time
// totals, to show makers and sponsors what a launch or an ad on DevHunt gets. Same look as
// /admin/analytics. One cached RPC every 10 minutes, nothing per visitor.
export const revalidate = 600;

export const metadata = {
  title: 'DevHunt open stats: visitors, impressions and launches',
  description: 'Live DevHunt numbers for the last 30 days: unique visitors, tool and ad impressions, countries, developers signed up and tools launched.',
  alternates: { canonical: '/stats' },
};

interface Day {
  day: string;
  visitors: number;
  pageviews: number;
  new_visitors: number;
  tool_impressions: number;
  ad_impressions_web: number;
  ad_impressions_email: number;
  launches: number;
  submissions: number;
  signups: number;
  users: number;
}
interface PublicStats {
  daily: Day[];
  countries: { country: string; visitors: number }[];
  visitors_since: string | null;
  impressions_since: string | null;
  ads_since: string | null;
  unique_visitors_all_time: number;
  tool_impressions_all_time: number;
  tools_launched: number;
  users: number;
  launch_impressions_median: number;
  first_launch: string;
}

const getPublicStats = unstable_cache(
  async (): Promise<PublicStats | null> => {
    const { data, error } = await serviceClient.rpc('get_public_stats' as never);
    if (error) throw new Error(error.message); // thrown, so a failure isn't cached for 10 minutes
    return data as unknown as PublicStats;
  },
  ['public-stats-v2'],
  { revalidate: 600 },
);

const fmt = (n: number) => Math.round(Number(n)).toLocaleString('en-US');
const short = (n: number) => (n >= 100_000 ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : fmt(n));
const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
};
const flag = (code: string) => String.fromCodePoint(0x1f1a5 + code.charCodeAt(0), 0x1f1a5 + code.charCodeAt(1));

// Days before a counter existed are "not tracked yet", not zero. The first tracked day and today are
// partial, so averages use the full days in between when there are any.
function series(daily: Day[], since: string | null, value: (d: Day) => number) {
  const today = daily[daily.length - 1]?.day;
  const tracked = since ? daily.filter(d => d.day >= since) : [];
  const full = tracked.filter(d => d.day > since! && d.day < today);
  const basis = full.length ? full : tracked;
  const total = tracked.reduce((sum, d) => sum + Number(value(d)), 0);
  return { total, avg: basis.length ? basis.reduce((sum, d) => sum + Number(value(d)), 0) / basis.length : 0, allTracked: tracked.length === daily.length };
}

function Tiles({ tiles }: { tiles: { label: string; value: string; hint: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 font-mono sm:grid-cols-4">
      {tiles.map(t => (
        <div key={t.label} className="bg-slate-900 px-4 py-4">
          <dt className="text-[11px] text-slate-500">{t.label}</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-50">{t.value}</dd>
          <dd className="mt-1 text-[11px] text-slate-500">{t.hint}</dd>
        </div>
      ))}
    </dl>
  );
}

// One bar per day; a bar can stack a few parts (e.g. site + newsletter). Untracked days are dashed.
function DayBars({
  daily,
  since,
  parts,
  tip,
  label,
  height = 'h-40',
}: {
  daily: Day[];
  since: string | null;
  parts: { value: (d: Day) => number; className: string }[];
  tip: (d: Day) => string;
  label: string;
  height?: string;
}) {
  const total = (d: Day) => parts.reduce((sum, p) => sum + Number(p.value(d)), 0);
  const max = Math.max(1, ...daily.map(total));
  const ticks = [0, 7, 14, 21, daily.length - 1];
  return (
    <>
      <div className={`mt-4 flex ${height} items-end gap-[2px]`} role="img" aria-label={label}>
        {daily.map(d => {
          const off = !since || d.day < since;
          return (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              {off ? (
                <div className="h-full w-full rounded-t-[4px] border border-dashed border-slate-800/80" />
              ) : total(d) ? (
                <div className="flex w-full flex-col-reverse overflow-hidden rounded-t-[4px]" style={{ height: `${Math.max(1, (total(d) / max) * 100)}%` }}>
                  {parts.map((p, i) => (
                    <div key={i} className={p.className} style={{ height: `${(Number(p.value(d)) / total(d)) * 100}%` }} />
                  ))}
                </div>
              ) : (
                <div className="h-[1%] w-full rounded-t-[4px] bg-slate-800" />
              )}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 group-hover:block">
                <div className="text-slate-500">{dayLabel(d.day)}</div>
                {off ? 'not tracked yet' : tip(d)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-600">
        {ticks.map(i => (
          <span key={i}>{daily[i] && dayLabel(daily[i].day)}</span>
        ))}
      </div>
    </>
  );
}

// Registered developers, running total. The y axis starts near the low end (labelled), so 30 days
// of growth on a 40K base stays visible.
function UsersChart({ daily }: { daily: Day[] }) {
  const values = daily.map(d => Number(d.users));
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const floor = Math.max(0, lo - (hi - lo) * 0.15);
  const span = Math.max(1, hi - floor);
  const W = 600;
  const H = 160;
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * W, H - ((v - floor) / span) * (H - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <>
      <div className="relative mt-4 h-40">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label="Registered developers, running total">
          <defs>
            <linearGradient id="users-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(251 146 60)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(251 146 60)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#users-fill)" />
          <path d={line} fill="none" stroke="rgb(251 146 60)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* Hover targets and tooltips, one per day, over the SVG. */}
        <div className="absolute inset-0 flex">
          {daily.map(d => (
            <div key={d.day} className="group relative h-full flex-1">
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 group-hover:block">
                <div className="text-slate-500">{dayLabel(d.day)}</div>
                {fmt(d.users)} developers · +{fmt(d.signups)} that day
              </div>
            </div>
          ))}
        </div>
        <span className="absolute left-0 top-0 font-mono text-[10px] text-slate-500">{fmt(hi)}</span>
        <span className="absolute bottom-0 left-0 font-mono text-[10px] text-slate-600">{fmt(floor)}</span>
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-600">
        {[0, 7, 14, 21, daily.length - 1].map(i => (
          <span key={i}>{daily[i] && dayLabel(daily[i].day)}</span>
        ))}
      </div>
    </>
  );
}

export default async function StatsPage() {
  const s = await getPublicStats().catch(e => {
    console.error('public stats failed:', e.message);
    return null;
  });
  if (!s?.daily?.length) return <p className="mt-20 text-center text-slate-400">Couldn&apos;t load the stats right now. Try again in a minute.</p>;
  const daily = s.daily;

  const visitors = series(daily, s.visitors_since, d => d.visitors);
  const pageviews = series(daily, s.visitors_since, d => d.pageviews);
  const toolImpr = series(daily, s.impressions_since, d => d.tool_impressions);
  const adImpr = series(daily, s.ads_since, d => Number(d.ad_impressions_web) + Number(d.ad_impressions_email));
  const signups = daily.reduce((sum, d) => sum + Number(d.signups), 0);
  const launches = daily.reduce((sum, d) => sum + Number(d.launches), 0);
  const submissions = daily.reduce((sum, d) => sum + Number(d.submissions), 0);
  const sinceNote = (since: string | null, t: { allTracked: boolean; total: number }) =>
    t.allTracked ? `${short(t.total)} in 30 days` : `${short(t.total)} since ${since ? dayLabel(since) : 'now'}, when counting started`;
  const countryTotal = Math.max(1, visitors.total);
  const maxCountry = Math.max(1, ...s.countries.map(c => Number(c.visitors)));
  const firstYear = new Date(s.first_launch).getUTCFullYear();

  const recent = [
    { label: 'daily_visitors', value: fmt(visitors.avg), hint: sinceNote(s.visitors_since, visitors) },
    { label: 'daily_tool_impressions', value: fmt(toolImpr.avg), hint: sinceNote(s.impressions_since, toolImpr) },
    { label: 'daily_ad_impressions', value: fmt(adImpr.avg), hint: sinceNote(s.ads_since, adImpr) },
    { label: 'new_developers', value: `+${fmt(signups)}`, hint: `signed up in 30 days, ${fmt(signups / daily.length)} a day` },
  ];
  const allTime = [
    { label: 'all_time_visitors', value: short(s.unique_visitors_all_time), hint: `unique, since launch in ${firstYear}` },
    { label: 'tool_impressions', value: short(s.tool_impressions_all_time), hint: 'all time, on tool cards and pages' },
    { label: 'tools_launched', value: fmt(s.tools_launched), hint: `${fmt(launches)} launched, ${fmt(submissions)} submitted in 30 days` },
    { label: 'developers', value: short(s.users), hint: 'registered accounts' },
    { label: 'impressions_per_launch', value: fmt(s.launch_impressions_median), hint: 'median, launches of the last 90 days' },
    { label: 'domain_rating', value: DOMAIN_RATING, hint: 'ahrefs' },
    { label: 'newsletter', value: short(AUDIENCE.newsletterSubscribers), hint: 'subscribers, weekly' },
    { label: 'pages_per_visit', value: (pageviews.total / Math.max(1, visitors.total)).toFixed(1), hint: `avg. visit ${AUDIENCE.avgVisitMinutes} min` },
  ];

  return (
    <section className="container-custom-screen mt-10 mb-20">
      <PageHeader eyebrow="Open stats" title="DevHunt in numbers">
        Live numbers from our own first-party analytics for the last 30 days, updated every 10 minutes. Counted without cookies; bots and automated browsers are
        skipped.
      </PageHeader>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/account/tools/new" className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-400">
          Launch your tool
        </Link>
        <Link href="/advertise" className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white">
          Advertise to developers
        </Link>
      </div>

      <div className="mt-10">
        <SectionLabel title="Last 30 days" hint="daily averages, UTC" />
        <div className="mt-4">
          <Tiles tiles={recent} />
        </div>
      </div>

      <div className="mt-12">
        <SectionLabel title="Unique visitors per day" hint="last 30 days, UTC" />
        <DayBars
          daily={daily}
          since={s.visitors_since}
          label="Unique visitors per day"
          parts={[{ value: d => d.visitors, className: 'bg-orange-400/80 group-hover:bg-orange-300' }]}
          tip={d => `${fmt(d.visitors)} visitors · ${fmt(d.pageviews)} page views`}
        />
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div>
          <SectionLabel title="Tool impressions per day" hint="all tools" />
          <DayBars
            daily={daily}
            since={s.impressions_since}
            label="Tool impressions per day"
            height="h-32"
            parts={[{ value: d => d.tool_impressions, className: 'bg-orange-400/80 group-hover:bg-orange-300' }]}
            tip={d => `${fmt(d.tool_impressions)} tool impressions`}
          />
        </div>
        <div>
          <SectionLabel
            title="Ad impressions per day"
            hint={
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-sm bg-orange-400/80" /> site
                </span>
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-sm bg-amber-200/80" /> newsletter
                </span>
              </span>
            }
          />
          <DayBars
            daily={daily}
            since={s.ads_since}
            label="Sponsor ad impressions per day"
            height="h-32"
            parts={[
              { value: d => d.ad_impressions_web, className: 'bg-orange-400/80 group-hover:bg-orange-300' },
              { value: d => d.ad_impressions_email, className: 'bg-amber-200/80' },
            ]}
            tip={d => `${fmt(d.ad_impressions_web)} on the site · ${fmt(d.ad_impressions_email)} in the newsletter`}
          />
        </div>
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div>
          <SectionLabel title="Registered developers" hint={`+${fmt(signups)} in 30 days`} />
          <UsersChart daily={daily} />
        </div>
        <div>
          <SectionLabel title="Tools submitted per day" hint={`+${fmt(submissions)} in 30 days`} />
          <DayBars
            daily={daily}
            since={daily[0].day}
            label="Tools submitted per day"
            parts={[{ value: d => d.submissions, className: 'bg-orange-400/80 group-hover:bg-orange-300' }]}
            tip={d => `${fmt(d.submissions)} tools submitted${Number(d.launches) ? ` · ${fmt(d.launches)} launched` : ''}`}
          />
        </div>
      </div>

      <div className="mt-12">
        <SectionLabel title="Since launch" hint={`${firstYear} to today`} />
        <div className="mt-4">
          <Tiles tiles={allTime} />
        </div>
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div>
          <SectionLabel title="Countries" hint="share of unique visitors, 30 days" />
          <ul className="mt-4 space-y-1 text-sm">
            {s.countries.map(c => (
              <li key={c.country} className="relative -mx-2 flex items-center justify-between rounded-md px-2 py-1.5">
                <span className="absolute inset-y-0 left-0 rounded-md bg-slate-800/70" style={{ width: `${(Number(c.visitors) / maxCountry) * 100}%` }} />
                <span className="relative truncate text-slate-200">
                  {flag(c.country)} {countryName(c.country)}
                </span>
                <span className="relative font-mono text-xs text-slate-400">{((Number(c.visitors) / countryTotal) * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <SectionLabel title="What you get" />
          <div className="rounded-xl border border-slate-800 p-5 text-sm text-slate-400">
            <h3 className="font-medium text-slate-100">Launch your tool</h3>
            <p className="mt-1.5">
              A launch week on the home page gets a median of {fmt(s.launch_impressions_median)} impressions, votes and comments from developers, and a tool page
              that stays up. Paid launches add a dofollow backlink from a DR {DOMAIN_RATING} domain.
            </p>
            <Link href="/account/tools/new" className="mt-3 inline-block text-orange-400 hover:text-orange-300">
              Launch your tool →
            </Link>
          </div>
          <div className="rounded-xl border border-slate-800 p-5 text-sm text-slate-400">
            <h3 className="font-medium text-slate-100">Advertise</h3>
            <p className="mt-1.5">
              Sidebar, in-list and newsletter spots in front of {short(s.users)} registered developers and {short(AUDIENCE.newsletterSubscribers)} newsletter
              readers. We write the ads from your URL. Monthly, cancel anytime.
            </p>
            <Link href="/advertise" className="mt-3 inline-block text-orange-400 hover:text-orange-300">
              See ad spots →
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-12 font-mono text-[11px] text-slate-500">
        Dashed days: that counter didn&apos;t exist yet. Visitors before first-party tracking started (Sep 2026) come from our previous analytics.
      </p>
    </section>
  );
}
