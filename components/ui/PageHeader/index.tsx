import { type ReactNode } from 'react';

// Page title block used by the list pages (upcoming, all tools, categories).
export default function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="pt-4 sm:pt-8">
      {eyebrow && <p className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">{eyebrow}</p>}
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-5xl [text-wrap:balance]">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-400">{children}</div>}
    </div>
  );
}
