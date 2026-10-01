import Link from 'next/link';
import SectionLabel from '@/components/ui/SectionLabel';
import { type DevHuntFacts, type Faq, type Verdict } from '@/utils/compareVerdict';

// "Which should I pick?" blocks of /compare/[pair]; the text comes from utils/compareVerdict.ts.

export function CompareVerdict({ verdict }: { verdict: Verdict }) {
  if (!verdict.sides.length && !verdict.notes.length) return null;
  return (
    <div className="mt-10">
      <SectionLabel title="Which to pick" />
      {verdict.sides.length > 0 && (
        <div className={`mt-4 grid gap-3 ${verdict.sides.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {verdict.sides.map(side => (
            <div key={side.name} className="rounded-2xl border border-slate-800 p-4">
              <h3 className="text-sm font-medium text-slate-50">Pick {side.name} if you want…</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {side.reasons.map(r => (
                  <li key={r} className="flex gap-x-2">
                    <span aria-hidden className="text-orange-400">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {verdict.notes.map(n => (
        <p key={n} className="mt-3 text-sm leading-relaxed text-slate-400">
          {n}
        </p>
      ))}
    </div>
  );
}

export function ComparePairFaq({ faq, title }: { faq: Faq[]; title: string }) {
  if (!faq.length) return null;
  return (
    <div className="mt-12">
      <SectionLabel title={title} />
      <div className="mt-2 divide-y divide-slate-800">
        {faq.map(f => (
          <details key={f.q} className="group py-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-x-4 text-sm font-medium text-slate-200 hover:text-white [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="font-mono text-slate-500 duration-150 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export interface DevHuntEntry {
  id: number;
  name: string;
  slug: string;
  facts: DevHuntFacts;
  alternatives: boolean; // link the tool's alternatives page
}

export function CompareDevHunt({ tools }: { tools: DevHuntEntry[] }) {
  return (
    <div className="mt-12">
      <SectionLabel title="On DevHunt" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tools.map(t => (
          <div key={t.id} className="rounded-2xl border border-slate-800 p-4 text-sm">
            <p className="font-medium text-slate-50">{t.name}</p>
            <p className="mt-1 text-slate-400">{[t.facts.votes, t.facts.status].filter(Boolean).join(' · ')}</p>
            <div className="mt-3 flex flex-wrap gap-x-4">
              <Link href={`/tool/${t.slug}`} className="text-orange-400 hover:text-orange-300">
                {t.name} on DevHunt →
              </Link>
              {t.alternatives && (
                <Link href={`/tool/${t.slug}/alternatives`} className="text-slate-400 hover:text-slate-200">
                  {t.name} alternatives
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
