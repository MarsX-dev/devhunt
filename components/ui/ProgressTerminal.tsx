'use client';

import { useEffect, useState } from 'react';

const IMPORT_STEPS = [
  'fetching your website',
  'reading what it does',
  'writing a tagline and description',
  'matching categories and pricing',
  'grabbing your logo and a screenshot',
  'double-checking everything',
];
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Terminal-style progress while a website is read (the tool import, sponsor ads; 3-15 seconds). Steps
// tick off at a slowing pace; the last one waits for the real result.
export default function ProgressTerminal({
  url,
  eyebrow = 'Launch',
  title = 'Reading your site…',
  command = 'submit',
  steps = IMPORT_STEPS,
  footer = "takes a few seconds · you'll review everything next",
  className = 'pt-6 sm:pt-14',
}: {
  url: string;
  eyebrow?: string | null;
  title?: string;
  command?: string;
  steps?: string[];
  footer?: string;
  className?: string;
}) {
  const [done, setDone] = useState(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const spin = setInterval(() => setFrame(f => (f + 1) % SPINNER.length), 90);
    const timers = steps.slice(0, -1).map((_, i) => setTimeout(() => setDone(d => Math.max(d, i + 1)), 900 + i * 1400 + i * i * 150));
    return () => {
      clearInterval(spin);
      timers.forEach(clearTimeout);
    };
  }, [steps]);

  const host = url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return (
    <div className={className} aria-live="polite" aria-busy="true">
      {eyebrow && <p className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">{eyebrow}</p>}
      <h1 className={`${eyebrow ? 'mt-3' : ''} text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl`}>{title}</h1>
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 font-mono text-[13px] leading-7">
        <div className="flex items-center gap-x-1.5 border-b border-slate-800 px-4 py-2.5 text-[11px] text-slate-600">
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          <span className="ml-2">devhunt — {command}</span>
        </div>
        <div className="px-4 py-3">
          <p className="text-slate-300">
            <span className="text-green-400">$</span> devhunt {command} <span className="text-orange-300">{host}</span>
          </p>
          {steps.map((step, i) =>
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
      <p className="mt-4 font-mono text-xs text-slate-600">{footer}</p>
    </div>
  );
}
