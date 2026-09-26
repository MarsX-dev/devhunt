'use client';

import { useEffect, useState } from 'react';
import { formatStat, type StatItem } from '@/utils/statFormat';

const COUNT_MS = 1400;

// All-time totals that start at "before today" and count up to now, while a "+N today" badge
// slides in, so visitors see the numbers are live.
export default function SiteStatsBar({ items }: { items: StatItem[] }) {
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
    <dl id="site-stats" className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800">
      {items.map(item => {
        const counts = typeof item.value === 'number';
        const delta = item.delta ?? 0;
        const shown = counts ? formatStat(Math.round((item.value as number) - delta * (1 - progress))) : item.value;
        return (
          <div key={item.label} className="bg-slate-900 px-4 py-3.5 sm:px-5">
            <dd className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl font-semibold tracking-tight text-slate-50 tabular-nums">{shown}</span>
              {delta > 0 && (
                <span
                  className="whitespace-nowrap font-mono text-[11px] text-green-400 tabular-nums transition-all duration-500 ease-out"
                  style={{ opacity: progress > 0 ? 1 : 0, transform: `translateY(${progress > 0 ? 0 : 6}px)` }}
                >
                  +{formatStat(delta)} {item.deltaLabel}
                </span>
              )}
            </dd>
            <dt className="mt-0.5 text-xs text-slate-500">{item.label}</dt>
          </div>
        );
      })}
    </dl>
  );
}
