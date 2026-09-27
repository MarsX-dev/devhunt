import Link from 'next/link';
import moment from 'moment';
import SectionLabel from '@/components/ui/SectionLabel';
import { FUNNEL_STEPS, MAIN_PATH } from '@/utils/funnel';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

interface Funnel {
  steps: Record<string, number>;
  countries: { country: string; journeys: number; created: number; checkout: number; paid: number }[];
  revenue: number;
  journeys: {
    journey: string;
    started_at: string;
    last_at: string;
    steps: string[];
    country: string | null;
    device: string | null;
    referrer: string | null;
    url: string | null;
    error: string | null;
    username: string | null;
    full_name: string | null;
    email: string | null;
    tool: string | null;
    tool_slug: string | null;
  }[];
}

const label = (step: string) => FUNNEL_STEPS.find(s => s.step === step)?.label ?? step;
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : '–');
const fmt = (n: number) => Number(n).toLocaleString('en-US');

// Furthest step on the main path, plus how the journey ended (paid, failed, free, came back unpaid).
function outcome(steps: string[]) {
  const furthest = [...MAIN_PATH].reverse().find(s => steps.includes(s));
  const ending = ['paid', 'payment_failed', 'checkout_canceled', 'free_chosen'].find(s => steps.includes(s));
  return { furthest: furthest ? label(furthest) : '—', ending };
}

// Submit → launch → payment funnel for the analytics page (DevHunt team only).
export default async function FunnelReport({ days }: { days: number }) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await serviceClient.rpc('get_funnel' as never, { _since: since } as never);
  const f = data as unknown as Funnel | null;
  if (!f) return null;
  const top = f.steps[MAIN_PATH[0]] ?? 0;
  const max = Math.max(1, ...MAIN_PATH.map(s => f.steps[s] ?? 0));

  return (
    <div className="mt-14 space-y-12">
      <div>
        <SectionLabel title="Submit funnel" hint={`last ${days} days · unique visitors per step · ${f.revenue ? `$${fmt(f.revenue)} revenue` : 'no revenue yet'}`} />
        <ol className="mt-2 font-mono text-xs">
          {MAIN_PATH.map((step, i) => {
            const n = f.steps[step] ?? 0;
            const prev = i ? f.steps[MAIN_PATH[i - 1]] ?? 0 : 0;
            return (
              <li key={step} className="grid grid-cols-[9.5rem_3.5rem_1fr_3rem_3rem] items-center gap-x-3 border-b border-slate-800/70 py-2">
                <span className="truncate text-slate-300">{label(step)}</span>
                <span className="text-right text-slate-50 tabular-nums">{fmt(n)}</span>
                <span className="h-2 rounded-r bg-orange-400/70" style={{ width: `${Math.max(n ? 1 : 0, (n / max) * 100)}%` }} />
                <span className="text-right text-slate-500" title="of previous step">
                  {i ? pct(n, prev) : ''}
                </span>
                <span className="text-right text-slate-600" title="of first step">
                  {i ? pct(n, top) : ''}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 font-mono text-[11px] text-slate-500">
          {['manual_form', 'import_done', 'week_picked', 'free_chosen', 'checkout_canceled', 'payment_failed'].map(s => `${label(s)} ${fmt(f.steps[s] ?? 0)}`).join(' · ')}
        </p>
      </div>

      {!!f.countries.length && (
        <div>
          <SectionLabel title="Funnel by country" />
          <table className="mt-2 w-full font-mono text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 font-normal">country</th>
                <th className="py-2 text-right font-normal">visitors</th>
                <th className="py-2 text-right font-normal">created</th>
                <th className="py-2 text-right font-normal">checkout</th>
                <th className="py-2 text-right font-normal">paid</th>
              </tr>
            </thead>
            <tbody>
              {f.countries.map(c => (
                <tr key={c.country} className="border-t border-slate-800/70 text-slate-300">
                  <td className="py-1.5">{c.country}</td>
                  <td className="py-1.5 text-right">{fmt(c.journeys)}</td>
                  <td className="py-1.5 text-right">{fmt(c.created)}</td>
                  <td className="py-1.5 text-right">{fmt(c.checkout)}</td>
                  <td className="py-1.5 text-right text-orange-300">{fmt(c.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <SectionLabel title="Latest journeys" hint="who went how far" />
        {f.journeys.length ? (
          <ul className="mt-2 divide-y divide-slate-800/70 text-xs">
            {f.journeys.map(j => {
              const { furthest, ending } = outcome(j.steps);
              const who = j.full_name || j.username || j.email || 'anonymous';
              return (
                <li key={j.journey} className="grid gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[7rem_1fr_auto]">
                  <span className="font-mono text-slate-500">{moment(j.last_at).fromNow()}</span>
                  <span className="min-w-0 text-slate-300">
                    <span className="text-slate-100">{who}</span>
                    {j.email && j.email !== who && <span className="text-slate-500"> · {j.email}</span>}
                    {j.tool && (
                      <>
                        {' · '}
                        <Link href={`/tool/${j.tool_slug}`} className="text-slate-200 underline decoration-slate-700 underline-offset-2">
                          {j.tool}
                        </Link>
                      </>
                    )}
                    {!j.tool && j.url && <span className="text-slate-500"> · {j.url}</span>}
                    {j.error && <span className="block text-red-300/80">! {j.error}</span>}
                  </span>
                  <span className="font-mono text-slate-400">
                    {[j.country, j.device, j.referrer].filter(Boolean).join(' · ')}
                    <span className="block text-right text-slate-200">
                      {furthest}
                      {ending && ending !== 'paid' && <span className="text-slate-500"> → {label(ending)}</span>}
                      {ending === 'paid' && <span className="text-orange-300"> ✓</span>}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No submissions yet. Steps are recorded from now on.</p>
        )}
      </div>
    </div>
  );
}
