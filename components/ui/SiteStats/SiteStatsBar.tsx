'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { formatStat, type StatItem } from '@/utils/statFormat';

const COUNT_MS = 1400;

// A small terminal: `$ devhunt stats --live`, four counters that count up to now with their
// recent growth, and the live activity line at the bottom.
export default function SiteStatsBar({ items, live }: { items: StatItem[]; live?: ReactNode }) {
  const [progress, setProgress] = useState(0); // 0 = before the recent growth, 1 = now

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setProgress(1);
    let frame = 0;
    let start = 0;
    const tick = (t: number) => {
      start ||= t;
      const p = Math.min(1, (t - start) / COUNT_MS);
      setProgress(1 - Math.pow(1 - p, 3)); // ease-out
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    const delay = setTimeout(() => (frame = requestAnimationFrame(tick)), 500);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div id="site-stats" className="mb-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-[11px] text-slate-500">
        <span>
          <span className="text-green-400">$</span> devhunt stats --live
        </span>
        <span className="flex items-center gap-x-1.5 text-green-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70 motion-safe:animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
          </span>
          live
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-slate-800 sm:grid-cols-4">
        {items.map(item => {
          const counts = typeof item.value === 'number';
          const delta = item.delta ?? 0;
          const shown = counts ? formatStat(Math.round((item.value as number) - delta * (1 - progress))) : item.value;
          return (
            <div key={item.label} className="bg-slate-900 px-4 py-3">
              <dt className="text-[11px] text-slate-500">{item.label}</dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight text-slate-50 tabular-nums">{shown}</dd>
              <dd className="mt-0.5 h-4 text-[11px] tabular-nums">
                {delta > 0 ? (
                  <span
                    className="whitespace-nowrap text-green-400 transition-all duration-500 ease-out"
                    style={{ opacity: progress > 0 ? 1 : 0, transform: `translateY(${progress > 0 ? 0 : 4}px)`, display: 'inline-block' }}
                  >
                    ▲ +{formatStat(delta)} {item.deltaLabel}
                  </span>
                ) : (
                  item.note && <span className="text-slate-600">{item.note}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      {live && <div className="border-t border-slate-800">{live}</div>}
    </div>
  );
}
