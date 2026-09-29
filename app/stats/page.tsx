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
  visitors_est: number; // estimates for days before a counter existed (stats_estimates), 0 if none
  pageviews_est: number;
  tool_impressions_est: number;
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
  tools_total: number;
  pageviews_tracked: number;
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
  ['public-stats-v5'],
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

// 30-day totals. Days before a counter existed count their estimate (stats_estimates) when there
// is one; `total` is the counted part only.
function series(daily: Day[], since: string | null, value: (d: Day) => number, estimate?: (d: Day) => number) {
  const tracked = since ? daily.filter(d => d.day >= since) : [];
  const total = tracked.reduce((sum, d) => sum + Number(value(d)), 0);
  const estimated = estimate ? daily.filter(d => !since || d.day < since).reduce((sum, d) => sum + Number(estimate(d)), 0) : 0;
  return { total, withEstimates: total + estimated, estimated: estimated > 0 };
}

// Compact stat grid: the last-30-days number big, the since-launch one under it.
interface Tile {
  label: string;
  value: string;
  total?: string; // since launch
  hint?: string;
}
function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 font-mono sm:grid-cols-4">
      {tiles.map(t => (
        <div key={t.label} className="bg-slate-900 px-4 py-3">
          <dt className="text-[11px] text-slate-500">{t.label}</dt>
          <dd className="mt-0.5 text-xl font-semibold text-slate-50">{t.value}</dd>
          {t.total && (
            <dd className="text-[11px] text-slate-400">
              {t.total} <span className="text-slate-500">all time</span>
            </dd>
          )}
          {t.hint && <dd className="text-[11px] text-slate-500">{t.hint}</dd>}
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
  estimate,
  label,
  height = 'h-40',
}: {
  daily: Day[];
  since: string | null;
  parts: { value: (d: Day) => number; className: string }[];
  tip: (d: Day) => string;
  estimate?: { value: (d: Day) => number; tip: (d: Day) => string };
  label: string;
  height?: string;
}) {
  const total = (d: Day) => parts.reduce((sum, p) => sum + Number(p.value(d)), 0);
  const est = (d: Day) => (estimate && (!since || d.day < since) ? Number(estimate.value(d)) : 0);
  const max = Math.max(1, ...daily.map(total), ...daily.map(est));
  const ticks = [0, 7, 14, 21, daily.length - 1];
  return (
    <>
      <div className={`mt-4 flex ${height} items-end gap-[2px]`} role="img" aria-label={label}>
        {daily.map(d => {
          const off = !since || d.day < since;
          return (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              {off && est(d)
                ? (
                <div className="w-full rounded-t-[4px] bg-slate-600/60 group-hover:bg-slate-500" style={{ height: `${Math.max(1, (est(d) / max) * 100)}%` }} />
                  )
                : off
                  ? (
                <div className="h-full w-full rounded-t-[4px] border border-dashed border-slate-800/80" />
                    )
                  : total(d)
                    ? (
                <div className="flex w-full flex-col-reverse overflow-hidden rounded-t-[4px]" style={{ height: `${Math.max(1, (total(d) / max) * 100)}%` }}>
                  {parts.map((p, i) => (
                    <div key={i} className={p.className} style={{ height: `${(Number(p.value(d)) / total(d)) * 100}%` }} />
                  ))}
                </div>
                      )
                    : (
                <div className="h-[1%] w-full rounded-t-[4px] bg-slate-800" />
                      )}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 group-hover:block">
                <div className="text-slate-500">{dayLabel(d.day)}</div>
                {off ? (estimate && est(d) ? estimate.tip(d) : 'not tracked yet') : tip(d)}
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

  const visitors = series(daily, s.visitors_since, d => d.visitors, d => d.visitors_est);
  const pageviews = series(daily, s.visitors_since, d => d.pageviews, d => d.pageviews_est);
  const toolImpr = series(daily, s.impressions_since, d => d.tool_impressions, d => d.tool_impressions_est);
  // Ads went live on ads_since, so earlier days have no ad impressions. They're projected (and shown
  // as projected): site ad impressions per page view, the lowest daily ratio seen since then (the
  // first, partial ad day included) to stay on the safe side, times that day's page views.
  const adBasis = daily.filter(d => s.ads_since && d.day >= s.ads_since);
  const adPerView = Math.min(...adBasis.filter(d => Number(d.pageviews)).map(d => Number(d.ad_impressions_web) / Number(d.pageviews)), Infinity);
  const adProjected = (d: Day) => (Number.isFinite(adPerView) ? Math.round(adPerView * Number(Number(d.pageviews) || d.pageviews_est)) : 0);
  const adImpr = series(daily, s.ads_since, d => Number(d.ad_impressions_web) + Number(d.ad_impressions_email), adProjected);
  const signups = daily.reduce((sum, d) => sum + Number(d.signups), 0);
  const submissions = daily.reduce((sum, d) => sum + Number(d.submissions), 0);
  const countryTotal = Math.max(1, visitors.total);
  const maxCountry = Math.max(1, ...s.countries.map(c => Number(c.visitors)));

  // All-time page views: counted since tracking started, plus the old dashboard's monthly figure
  // (AUDIENCE.pageViewsPerMonth) for every month from the first launch until then. An estimate (~).
  const trackedFrom = s.visitors_since ? Date.parse(s.visitors_since) : Date.now();
  const monthsBefore = Math.max(0, (trackedFrom - Date.parse(s.first_launch)) / (30.44 * 86400000));
  const pageviewsAllTime = Number(s.pageviews_tracked) + monthsBefore * AUDIENCE.pageViewsPerMonth;

  const tiles: Tile[] = [
    { label: 'visitors', value: short(visitors.withEstimates), total: short(s.unique_visitors_all_time) },
    { label: 'tool_impressions', value: short(toolImpr.withEstimates), total: short(s.tool_impressions_all_time) },
    { label: 'new_developers', value: `+${fmt(signups)}`, total: short(s.users) },
    { label: 'tools_launched', value: fmt(submissions), total: fmt(s.tools_total) }, // every tool submitted, paid or free
    { label: 'page_views', value: short(pageviews.withEstimates), total: `~${short(pageviewsAllTime)}` },
    { label: 'ad_impressions', value: short(adImpr.withEstimates), hint: s.ads_since && adImpr.estimated ? `projected before ${dayLabel(s.ads_since)}` : undefined },
    // The newsletter goes to every registered account.
    { label: 'newsletter', value: short(s.users), hint: 'subscribers, weekly' },
    { label: 'domain_rating', value: DOMAIN_RATING, hint: 'ahrefs' },
  ];

  return (
    <section className="container-custom-screen mt-10 mb-20">
      <PageHeader eyebrow="Open stats" title="DevHunt in numbers">
        Live numbers from our own first-party analytics for the last 30 days, updated every 10 minutes. Counted without cookies; bots and automated browsers are
        skipped. Days before our counters started (late Sep 2026) are estimated from per-tool impression totals.
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
        <SectionLabel
          title="Last 30 days · all time"
          hint={visitors.estimated && s.visitors_since ? `30-day visits estimated before ${dayLabel(s.visitors_since)}` : 'UTC'}
        />
        <div className="mt-4">
          <Tiles tiles={tiles} />
        </div>
      </div>

      <div className="mt-12">
        <SectionLabel
          title="Unique visitors per day"
          hint={
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <i className="h-2 w-2 rounded-sm bg-orange-400/80" /> counted
              </span>
              <span className="flex items-center gap-1">
                <i className="h-2 w-2 rounded-sm bg-slate-600" /> estimate, before tracking
              </span>
            </span>
          }
        />
        <DayBars
          daily={daily}
          since={s.visitors_since}
          label="Unique visitors per day"
          parts={[{ value: d => d.visitors, className: 'bg-orange-400/80 group-hover:bg-orange-300' }]}
          tip={d => `${fmt(d.visitors)} visitors · ${fmt(d.pageviews)} page views`}
          estimate={{ value: d => d.visitors_est, tip: d => `≈${fmt(d.visitors_est)} visitors · ≈${fmt(d.pageviews_est)} page views (estimate)` }}
        />
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div>
          <SectionLabel
            title="Tool impressions per day"
            hint={
              <span className="flex items-center gap-1">
                <i className="h-2 w-2 rounded-sm bg-slate-600" /> estimate
              </span>
            }
          />
          <DayBars
            daily={daily}
            since={s.impressions_since}
            label="Tool impressions per day"
            height="h-32"
            parts={[{ value: d => d.tool_impressions, className: 'bg-orange-400/80 group-hover:bg-orange-300' }]}
            tip={d => `${fmt(d.tool_impressions)} tool impressions`}
            estimate={{ value: d => d.tool_impressions_est, tip: d => `≈${fmt(d.tool_impressions_est)} tool impressions (estimate)` }}
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
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-sm bg-slate-600" /> projected
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
            estimate={{ value: adProjected, tip: d => `≈${fmt(adProjected(d))} projected: ads started ${s.ads_since ? dayLabel(s.ads_since) : 'later'}` }}
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
              Sidebar, in-list and newsletter spots in front of {short(s.users)} registered developers, who
              also get the weekly newsletter. We write the ads from your URL. Monthly, cancel anytime.
            </p>
            <Link href="/advertise" className="mt-3 inline-block text-orange-400 hover:text-orange-300">
              See ad spots →
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-12 font-mono text-[11px] text-slate-500">
        All-time page views (~) are counted since Sep 27 plus 150K a month before that, from our previous analytics. Grey bars are estimates for the days before our own counters started: each weekly launch batch collects about 50–60K impressions, almost
        all in its launch week, spread over the days by daily sign-ups; visitors follow from the visitor-to-impression ratio we now measure. Dashed days:
        that counter didn&apos;t exist yet. Sponsor ads started Sep 28; grey ad bars before that are projected from the lowest daily ad-impressions-per-page-view ratio measured since then. Visitors before first-party tracking started (Sep 2026) come from our previous analytics.
      </p>
    </section>
  );
}
