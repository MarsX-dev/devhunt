'use client';

import { useEffect, useMemo, useState } from 'react';
import { AD_PRODUCTS, type AdKind } from '@/utils/ads';

// Advertiser portal stats: impressions, clicks, CTR, a daily trend, countries and devices.
type Row = { impressions: number; clicks: number };
type Stats = {
  totals: Row;
  daily: (Row & { day: string })[];
  countries: (Row & { country: string })[];
  devices: (Row & { device: string })[];
  from: string | null;
};
type AdOption = { id: number; name: string; kind: AdKind };

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 0, label: 'All time' },
];
const num = (n: number) => new Intl.NumberFormat('en-US', { notation: n >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
const pct = (clicks: number, imps: number) => (imps ? `${((clicks / imps) * 100).toFixed(clicks / imps < 0.01 ? 2 : 1)}%` : '–');
const regionName = (() => {
  try {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    return (code: string) => (code === 'XX' ? 'Unknown' : names.of(code) ?? code);
  } catch {
    return (code: string) => code;
  }
})();
const DEVICE: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet', email: 'Newsletter' };

// Every day in the range, zeros included, so gaps read as "no traffic" rather than disappearing.
function fillDays(daily: Stats['daily'], from: string | null) {
  const byDay = new Map(daily.map(d => [d.day, d]));
  const start = from ?? daily[0]?.day;
  if (!start) return [];
  const out: Stats['daily'] = [];
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.now(); t += 86400_000) {
    const day = new Date(t).toISOString().slice(0, 10);
    out.push({ day, impressions: Number(byDay.get(day)?.impressions ?? 0), clicks: Number(byDay.get(day)?.clicks ?? 0) });
  }
  return out;
}

function Trend({ days, metric, title }: { days: Stats['daily']; metric: 'impressions' | 'clicks'; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = metric === 'impressions' ? 160 : 90;
  const pad = { t: 8, r: 8, b: 20, l: 36 };
  const max = Math.max(1, ...days.map(d => d[metric]));
  const x = (i: number) => pad.l + (days.length <= 1 ? 0 : (i / (days.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[metric]).toFixed(1)}`).join('');
  const area = `${line}L${x(days.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const h = hover !== null ? days[hover] : null;
  const label = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        <p className="font-mono text-xs text-slate-500">
          {h ? (
            <>
              {label(h.day)} · <span className="text-slate-200">{num(h[metric])}</span>
            </>
          ) : (
            'hover the chart for a day'
          )}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full touch-none select-none"
        role="img"
        aria-label={`${title} per day`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - box.left) / box.width) * W;
          const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (days.length - 1));
          setHover(Math.min(days.length - 1, Math.max(0, i)));
        }}
      >
        {[0, 0.5, 1].map(f => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} className="stroke-slate-800" strokeWidth={1} />
            <text x={pad.l - 6} y={y(max * f) + 3} textAnchor="end" className="fill-slate-500 font-mono text-[9px]">
              {num(Math.round(max * f))}
            </text>
          </g>
        ))}
        {days.length > 1 && (
          <>
            <path d={area} className="fill-orange-400/10" />
            <path d={line} fill="none" className="stroke-orange-400" strokeWidth={2} strokeLinejoin="round" />
          </>
        )}
        {days.length > 0 && [0, days.length - 1].map(i => (
          <text key={i} x={x(i)} y={H - 4} textAnchor={i ? 'end' : 'start'} className="fill-slate-500 font-mono text-[9px]">
            {label(days[i].day)}
          </text>
        ))}
        {h && hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(0)} className="stroke-slate-600" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(h[metric])} r={4} className="fill-orange-400 stroke-slate-900" strokeWidth={2} />
          </>
        )}
      </svg>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { key: string; label: string; impressions: number; clicks: number }[] }) {
  const max = Math.max(1, ...rows.map(r => r.impressions));
  return (
    <div className="rounded-2xl border border-slate-800 p-5">
      <div className="grid grid-cols-[1fr_4rem_3.5rem_3.5rem] gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
        <span>{title}</span>
        <span className="text-right">views</span>
        <span className="text-right">clicks</span>
        <span className="text-right">ctr</span>
      </div>
      {rows.length ? (
        <ul className="mt-3 space-y-1.5">
          {rows.map(r => (
            <li key={r.key} className="grid grid-cols-[1fr_4rem_3.5rem_3.5rem] items-center gap-2 text-sm" title={`${r.label}: ${r.impressions} views, ${r.clicks} clicks`}>
              <div className="relative h-7 overflow-hidden rounded-md">
                <div className="absolute inset-y-0 left-0 rounded-md bg-orange-400/20" style={{ width: `${Math.max(3, (r.impressions / max) * 100)}%` }} />
                <span className="relative flex h-full items-center truncate px-2 text-slate-200">{r.label}</span>
              </div>
              <span className="text-right font-mono text-xs tabular-nums text-slate-300">{num(r.impressions)}</span>
              <span className="text-right font-mono text-xs tabular-nums text-slate-300">{num(r.clicks)}</span>
              <span className="text-right font-mono text-xs tabular-nums text-slate-500">{pct(r.clicks, r.impressions)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No data yet.</p>
      )}
    </div>
  );
}

export default function AdStats({ ads }: { ads: AdOption[] }) {
  const [days, setDays] = useState(30);
  const [ad, setAd] = useState<number | 0>(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ads/stats?days=${days}${ad ? `&ad=${ad}` : ''}`)
      .then(r => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [days, ad]);

  const series = useMemo(() => fillDays(stats?.daily ?? [], stats?.from ?? null), [stats]);
  const t = { impressions: Number(stats?.totals.impressions ?? 0), clicks: Number(stats?.totals.clicks ?? 0) };
  const top = stats?.countries?.[0];
  const tiles = [
    { label: 'Impressions', value: num(t.impressions), note: 'times your ad was on screen' },
    { label: 'Clicks', value: num(t.clicks), note: 'visits sent to your site' },
    { label: 'Click-through rate', value: pct(t.clicks, t.impressions), note: 'clicks / impressions' },
    { label: 'Top country', value: top ? regionName(top.country) : '–', note: top ? `${num(Number(top.impressions))} impressions` : 'no data yet' },
  ];

  return (
    <div className="mt-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Performance</h2>
        <div className="flex flex-wrap items-center gap-2">
          {ads.length > 1 && (
            <select value={ad} onChange={e => setAd(Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200">
              <option value={0}>All ads</option>
              {ads.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} · {AD_PRODUCTS[a.kind].title}
                </option>
              ))}
            </select>
          )}
          <div className="flex rounded-lg bg-slate-800/70 p-0.5 text-xs">
            {RANGES.map(r => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`rounded-md px-2.5 py-1 duration-150 ${days === r.days ? 'bg-slate-950 text-slate-50 ring-1 ring-orange-500/60' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 duration-150 sm:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
        {tiles.map(tile => (
          <div key={tile.label} className="bg-slate-900 p-4">
            <p className="font-mono text-[11px] text-slate-500">{tile.label}</p>
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums text-slate-50">{tile.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{tile.note}</p>
          </div>
        ))}
      </div>

      <div className={`mt-4 space-y-6 rounded-2xl border border-slate-800 p-5 ${loading ? 'opacity-60' : ''}`}>
        {series.length ? (
          <>
            <Trend days={series} metric="impressions" title="Impressions per day" />
            <Trend days={series} metric="clicks" title="Clicks per day" />
          </>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No data yet. Stats show up within minutes of your ad going live.</p>
        )}
      </div>

      <div className={`mt-4 grid gap-4 md:grid-cols-2 ${loading ? 'opacity-60' : ''}`}>
        <Breakdown
          title="Country"
          rows={(stats?.countries ?? []).map(c => ({ key: c.country, label: regionName(c.country), impressions: Number(c.impressions), clicks: Number(c.clicks) }))}
        />
        <Breakdown
          title="Device"
          rows={(stats?.devices ?? []).map(d => ({ key: d.device, label: DEVICE[d.device] ?? d.device, impressions: Number(d.impressions), clicks: Number(d.clicks) }))}
        />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        An impression counts when at least half of your ad is on screen, once per page view; bots are excluded. Newsletter impressions are the recipients of each edition.
      </p>
    </div>
  );
}
