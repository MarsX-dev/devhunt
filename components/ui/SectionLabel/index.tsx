import { type ReactNode } from 'react';

// Section heading: mono caps title, a divider line next to it, and an optional hint on the right.
export default function SectionLabel({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="flex items-center gap-x-3">
      <h2 className="flex-none font-mono text-[11px] uppercase tracking-[0.14em] text-slate-300">{title}</h2>
      <span aria-hidden className="h-px min-w-6 flex-1 bg-slate-800" />
      {hint && <div className="flex-none text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
