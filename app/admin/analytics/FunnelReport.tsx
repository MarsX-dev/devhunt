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
// Click a step (?step=...) to list everyone who reached it.
export default async function FunnelReport({ days, step: picked }: { days: number; step?: string }) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const selected = picked && FUNNEL_STEPS.some(s => s.step === picked && !s.step.startsWith('ad_')) ? picked : null;
  const [{ data }, people] = await Promise.all([
    serviceClient.rpc('get_funnel' as never, { _since: since } as never),
    selected ? serviceClient.rpc('get_funnel_step' as never, { _since: since, _step: selected } as never).then(r => (r.data ?? []) as unknown as StepPerson[]) : Promise.resolve(null),
  ]);
  const f = data as unknown as Funnel | null;
  if (!f) return null;
  const stepHref = (s: string) => (s === selected ? `?days=${days}#funnel` : `?days=${days}&step=${s}#funnel-step`);
  const top = f.steps[MAIN_PATH[0]] ?? 0;
  const max = Math.max(1, ...MAIN_PATH.map(s => f.steps[s] ?? 0));

  return (
    <div className="mt-14 space-y-12">
      <div>
        <SectionLabel title="Submit funnel" hint={`last ${days === 1 ? '24 hours' : `${days} days`} · unique visitors per step · ${f.revenue ? `$${fmt(f.revenue)} revenue` : 'no revenue yet'}`} />
        <ol id="funnel" className="mt-2 scroll-mt-20 font-mono text-xs">
          {MAIN_PATH.map((step, i) => {
            const n = f.steps[step] ?? 0;
            const prev = i ? f.steps[MAIN_PATH[i - 1]] ?? 0 : 0;
            return (
              <li key={step} className="border-b border-slate-800/70">
                <Link
                  href={stepHref(step)}
                  scroll={false}
                  title="Show who reached this step"
                  className={`grid grid-cols-[9.5rem_3.5rem_1fr_3rem_3rem] items-center gap-x-3 py-2 duration-150 hover:bg-slate-800/40 ${step === selected ? 'bg-slate-800/60' : ''}`}
                >
                <span className="truncate text-slate-300 underline decoration-slate-700 underline-offset-4">{label(step)}</span>
                <span className="text-right text-slate-50 tabular-nums">{fmt(n)}</span>
                <span className="h-2 rounded-r bg-orange-400/70" style={{ width: `${Math.max(n ? 1 : 0, (n / max) * 100)}%` }} />
                <span className="text-right text-slate-500" title="of previous step">
                  {i ? pct(n, prev) : ''}
                </span>
                <span className="text-right text-slate-600" title="of first step">
                  {i ? pct(n, top) : ''}
                </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 font-mono text-[11px] text-slate-500">
          {['manual_form', 'import_done', 'week_picked', 'free_chosen', 'upsell_click', 'checkout_canceled', 'payment_failed'].map((s, i) => (
            <span key={s}>
              {i ? ' · ' : ''}
              <Link href={stepHref(s)} scroll={false} className={`hover:text-slate-300 ${s === selected ? 'text-slate-200 underline' : ''}`}>
                {label(s)} {fmt(f.steps[s] ?? 0)}
              </Link>
            </span>
          ))}
        </p>
        {selected && people && <StepPeople step={selected} people={people} days={days} />}
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

interface StepPerson {
  journey: string;
  step_at: string;
  last_at: string;
  steps: string[];
  country: string | null;
  device: string | null;
  referrer: string | null;
  url: string | null;
  error: string | null;
  week: string | null;
  username: string | null;
  full_name: string | null;
  email: string | null;
  tool: string | null;
  tool_slug: string | null;
  website: string | null;
  tool_paid: boolean | null;
  tool_deleted: boolean | null;
}

// Everyone who reached one step: who, their tool, and how it ended. From "opened checkout" on, the ones
// who didn't pay are marked (paid later counts: the tool is paid now).
function StepPeople({ step, people, days }: { step: string; people: StepPerson[]; days: number }) {
  const checkoutOrLater = ['week_picked', 'checkout_started', 'checkout_canceled', 'payment_failed', 'upsell_click'].includes(step);
  const unpaid = people.filter(p => !p.steps.includes('paid') && !p.tool_paid).length;
  return (
    <div id="funnel-step" className="mt-6 scroll-mt-20 rounded-xl border border-slate-800 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs text-slate-300">
          {label(step)}: {fmt(people.length)} {people.length === 1 ? 'person' : 'people'}
          {checkoutOrLater && <span className="text-red-300"> · {fmt(unpaid)} didn&apos;t pay</span>}
        </p>
        <Link href={`?days=${days}#funnel`} scroll={false} className="font-mono text-[11px] text-slate-500 hover:text-slate-300">
          close ✕
        </Link>
      </div>
      {people.length ? (
        <ul className="mt-2 divide-y divide-slate-800/70 text-xs">
          {people.map(p => {
            const paid = p.steps.includes('paid') || !!p.tool_paid;
            const who = p.full_name || p.username || p.email || 'anonymous visitor';
            return (
              <li key={p.journey} className="grid gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[7rem_1fr_auto]">
                <span className="font-mono text-slate-500" title={p.step_at}>
                  {moment(p.step_at).fromNow()}
                </span>
                <span className="min-w-0 text-slate-300">
                  <span className="text-slate-100">{who}</span>
                  {p.email && p.email !== who && (
                    <a href={`mailto:${p.email}`} className="text-slate-400 hover:text-slate-200">
                      {' '}
                      · {p.email}
                    </a>
                  )}
                  {p.tool && (
                    <span className="block">
                      {p.tool_slug && !p.tool_deleted ? (
                        <Link href={`/tool/${p.tool_slug}`} className="text-slate-200 underline decoration-slate-700 underline-offset-2">
                          {p.tool}
                        </Link>
                      ) : (
                        <span className="text-slate-400">{p.tool}{p.tool_deleted ? ' (deleted)' : ''}</span>
                      )}
                      {(p.website || p.url) && <span className="text-slate-500"> · {(p.website || p.url)!.replace(/^https?:\/\//, '').slice(0, 60)}</span>}
                    </span>
                  )}
                  {!p.tool && p.url && <span className="block text-slate-500">{p.url}</span>}
                  {p.error && <span className="block text-red-300/80">! {p.error}</span>}
                </span>
                <span className="font-mono text-slate-400 sm:text-right">
                  {[p.country, p.device, p.referrer].filter(Boolean).join(' · ')}
                  <span className="block">
                    {paid ? (
                      <span className="text-green-400">paid ✓</span>
                    ) : p.steps.includes('payment_failed') ? (
                      <span className="text-red-300">payment failed</span>
                    ) : p.steps.includes('checkout_started') ? (
                      <span className="text-red-300">opened Stripe, didn&apos;t pay</span>
                    ) : (
                      <span className="text-slate-500">got to: {outcome(p.steps).furthest}</span>
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Nobody in this period.</p>
      )}
    </div>
  );
}
