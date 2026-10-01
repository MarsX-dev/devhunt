import moment from 'moment';
import SectionLabel from '@/components/ui/SectionLabel';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// Day-by-day conversion of the submit funnel, plus "when did this last happen" for the steps that
// break silently (a form bug stops tools being created, a Stripe outage stops payments).
const RATES = [
  { from: 'submit_view', to: 'tool_created', label: 'submit page → tool created' },
  { from: 'launch_view', to: 'checkout_started', label: 'launch options → checkout' },
  { from: 'checkout_started', to: 'paid', label: 'checkout → paid' },
];
const WATCHED = [
  { step: 'tool_created', label: 'tool created' },
  { step: 'checkout_started', label: 'checkout opened' },
  { step: 'paid', label: 'paid' },
];
const DAY = 86400000;
const fmt = (n: number) => Number(n).toLocaleString('en-US');
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : '–');

export default async function FunnelDaily({ days }: { days: number }) {
  const chartDays = Math.min(90, Math.max(14, days)); // the 24h view still gets two weeks of days
  const since24h = new Date(Date.now() - DAY).toISOString();
  const count24h = (step: string, stripeEvent?: string) => {
    let q = serviceClient.from('funnel_events').select('id', { count: 'exact', head: true }).eq('step', step).gte('created_at', since24h);
    if (stripeEvent) q = q.eq('props->>stripe_event', stripeEvent);
    return q.then(r => r.count ?? 0);
  };
  const [{ data }, lastAt, failed24h, paid24h] = await Promise.all([
    serviceClient.rpc('get_funnel_daily' as never, { _days: chartDays } as never),
    Promise.all(
      WATCHED.map(w =>
        serviceClient
          .from('funnel_events')
          .select('created_at')
          .eq('step', w.step)
          .order('created_at', { ascending: false })
          .limit(1)
          .then(r => (r.data?.[0]?.created_at as string | undefined) ?? null),
      ),
    ),
    count24h('payment_failed', 'payment_intent.payment_failed'), // not expired checkouts: those are people leaving
    count24h('paid'),
  ]);
  const rows = (data ?? []) as unknown as { day: string; step: string; n: number }[];
  if (!rows.length) return null;

  const counts = new Map(rows.map(r => [`${r.day}|${r.step}`, Number(r.n)]));
  const n = (day: string, step: string) => counts.get(`${day}|${step}`) ?? 0;
  const firstDay = rows.reduce((min, r) => (r.day < min ? r.day : min), rows[0].day); // funnel tracking started
  const today = new Date().toISOString().slice(0, 10);
  const slots = Array.from({ length: chartDays }, (_, i) => new Date(Date.now() - (chartDays - 1 - i) * DAY).toISOString().slice(0, 10)).map(day => ({
    day,
    noData: day < firstDay,
  }));
  const tracked = slots.filter(s => !s.noData);

  // A step is overdue when it hasn't happened for 3x its usual gap over the last 7 days (at least 2h).
  const week = tracked.slice(-7);
  const health = WATCHED.map((w, i) => {
    const total = week.reduce((sum, s) => sum + n(s.day, w.step), 0);
    const usualGap = total ? (week.length * DAY) / total : null;
    const last = lastAt[i];
    const since = last ? Date.now() - Date.parse(last) : Infinity;
    const overdue = usualGap != null && since > Math.max(2 * 3600000, 3 * usualGap);
    return { ...w, last, overdue, usualGap };
  });
  const failingPayments = failed24h >= 2 && failed24h >= paid24h;

  return (
    <div className="mt-10">
      <SectionLabel title="Funnel health" hint="red = worth checking for a bug" />
      <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 font-mono sm:grid-cols-4">
        {health.map(h => (
          <div key={h.step} className="bg-slate-900 px-4 py-3">
            <dt className="text-[11px] text-slate-500">last {h.label}</dt>
            <dd className={`mt-1 text-sm font-semibold ${h.overdue ? 'text-red-400' : 'text-slate-100'}`} title={h.last ?? ''}>
              {h.last ? moment(h.last).fromNow() : 'never'}
            </dd>
            <dd className="mt-0.5 text-[11px] text-slate-500">{h.usualGap ? `usually every ${moment.duration(h.usualGap).humanize()}` : 'none in 7 days'}</dd>
          </div>
        ))}
        <div className="bg-slate-900 px-4 py-3">
          <dt className="text-[11px] text-slate-500">card declines, 24h</dt>
          <dd className={`mt-1 text-sm font-semibold ${failingPayments ? 'text-red-400' : 'text-slate-100'}`}>{fmt(failed24h)}</dd>
          <dd className="mt-0.5 text-[11px] text-slate-500">vs {fmt(paid24h)} paid</dd>
        </div>
      </dl>

      <div className="mt-8">
        <SectionLabel title="Conversion per day" hint={`last ${chartDays} days, UTC · today is partial · red = nobody converted`} />
        <div className="mt-4 space-y-5">
          {RATES.map(r => {
            const from = tracked.reduce((sum, s) => sum + n(s.day, r.from), 0);
            const to = tracked.reduce((sum, s) => sum + n(s.day, r.to), 0);
            return (
              <div key={r.to}>
                <div className="flex items-baseline justify-between font-mono text-[11px]">
                  <span className="text-slate-300">{r.label}</span>
                  <span className="text-slate-500">
                    {pct(to, from)} overall · {fmt(to)} of {fmt(from)}
                  </span>
                </div>
                <div className="mt-1.5 flex h-14 items-end gap-[2px]" role="img" aria-label={`${r.label} per day`}>
                  {slots.map(s => {
                    const a = n(s.day, r.from);
                    const b = n(s.day, r.to);
                    // Zero conversions out of a few attempts is the "something broke" signal.
                    const broken = !s.noData && a >= 3 && b === 0;
                    const rate = a ? Math.min(1, b / a) : 0;
                    return (
                      <div key={s.day} className="group relative flex h-full flex-1 items-end">
                        {s.noData ? (
                          <div className="h-full w-full rounded-t-[3px] border border-dashed border-slate-800/80" />
                        ) : broken ? (
                          <div className="h-full w-full rounded-t-[3px] bg-red-500/30 group-hover:bg-red-500/50" />
                        ) : (
                          <div
                            className={`w-full rounded-t-[3px] ${a ? 'bg-orange-400/80 group-hover:bg-orange-300' : 'bg-slate-800'} ${s.day === today ? 'opacity-60' : ''}`}
                            style={{ height: `${Math.max(2, rate * 100)}%` }}
                          />
                        )}
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 group-hover:block">
                          <div className="text-slate-500">
                            {s.day}
                            {s.day === today ? ' (so far)' : ''}
                          </div>
                          {s.noData ? 'no data: funnel tracking started later' : `${pct(b, a)} · ${fmt(b)} of ${fmt(a)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-600">
          {[0, Math.floor(slots.length / 2), slots.length - 1].map(i => (
            <span key={i}>{slots[i]?.day.slice(5)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
