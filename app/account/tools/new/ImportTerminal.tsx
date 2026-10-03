'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  'fetching your website',
  'reading what it does',
  'writing a tagline and description',
  'matching categories and pricing',
  'grabbing your logo and a screenshot',
  'double-checking everything',
];
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Terminal-style progress while the website import runs (it usually takes 3-10 seconds).
export default function ImportTerminal({ url }: { url: string }) {
  const [done, setDone] = useState(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const spin = setInterval(() => setFrame(f => (f + 1) % SPINNER.length), 90);
    // Steps tick off at a slowing pace; the last one waits for the real result.
    const timers = STEPS.slice(0, -1).map((_, i) => setTimeout(() => setDone(d => Math.max(d, i + 1)), 900 + i * 1400 + i * i * 150));
    return () => {
      clearInterval(spin);
      timers.forEach(clearTimeout);
    };
  }, []);

  const host = url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return (
    <div className="pt-6 sm:pt-14" aria-live="polite" aria-busy="true">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Launch</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">Reading your site…</h1>
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 font-mono text-[13px] leading-7">
        <div className="flex items-center gap-x-1.5 border-b border-slate-800 px-4 py-2.5 text-[11px] text-slate-600">
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          <span className="ml-2">devhunt — submit</span>
        </div>
        <div className="px-4 py-3">
          <p className="text-slate-300">
            <span className="text-green-400">$</span> devhunt submit <span className="text-orange-300">{host}</span>
          </p>
          {STEPS.map((step, i) =>
            i > done ? null : (
              <p key={step} className="flex items-center gap-x-2 text-slate-400 motion-safe:animate-slide-up">
                <span className={`w-3 ${i < done ? 'text-green-400' : 'text-orange-400'}`}>{i < done ? '✓' : SPINNER[frame]}</span>
                <span className={i < done ? 'text-slate-500' : 'text-slate-200'}>{step}</span>
                {i < done && <span className="text-slate-700">{'.'.repeat(Math.max(2, 36 - step.length))} ok</span>}
              </p>
            ),
          )}
          <p className="text-slate-600">
            <span className="inline-block h-4 w-2 translate-y-0.5 bg-slate-500 motion-safe:animate-pulse" />
          </p>
        </div>
      </div>
      <p className="mt-4 font-mono text-xs text-slate-600">takes a few seconds · you&apos;ll review everything next</p>
    </div>
  );
}
