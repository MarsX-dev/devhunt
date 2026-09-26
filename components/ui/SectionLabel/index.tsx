import { type ReactNode } from 'react';

// Small mono-caps heading used for the home page sections.
export default function SectionLabel({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-x-4 border-b border-slate-800 pb-3">
      <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-slate-300">{title}</h2>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
