import SectionLabel from '@/components/ui/SectionLabel';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

const LIST_PRICE = 4900; // cents; paid launches before the payments table (2026-09-26) have no recorded amount
const usd = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const DEV = { label: 'Dev tools', bar: 'bg-orange-400/80', dot: 'bg-orange-400', color: '#fb923c' };
const OTHER = { label: 'Other tools', bar: 'bg-sky-400/80', dot: 'bg-sky-400', color: '#38bdf8' };

// Paid-launch revenue for the range picked above (1 = last 24 hours, hour by hour), split into dev tools
// and "other" tools (moderation 'not_a_fit'). A tool counts if isPaid; its amount and day come from the
// Stripe payment when one is recorded, else the $49 list price on the day the tool was submitted.
export default async function RevenueReport({ days }: { days: number }) {
  const hourly = days === 1;
  const step = hourly ? 3600000 : 86400000;
  const count = hourly ? 24 : days;
  const keyLen = hourly ? 13 : 10; // ISO prefix: hour or day
  const now = new Date();
  if (hourly) now.setUTCMinutes(0, 0, 0);
  const keys = Array.from({ length: count }, (_, i) => new Date(now.getTime() - (count - 1 - i) * step).toISOString().slice(0, keyLen));
  const since = hourly ? `${keys[0]}:00:00Z` : keys[0];
  const { data: tools } = await serviceClient
    .from('products')
    .select('id, created_at, moderation')
    .eq('isPaid', true)
    .gte('created_at', since);
  if (!tools) return null;
  const ids = tools.map(t => t.id);
  const { data: payments } = ids.length
    ? await serviceClient.from('payments').select('product_id, amount_total, created_at').eq('payment_status', 'paid').in('product_id', ids)
    : { data: [] };
  const paymentFor = new Map((payments ?? []).map(p => [p.product_id, p]));

  const byDay = new Map<string, { dev: number; other: number }>();
  for (const k of keys) byDay.set(k, { dev: 0, other: 0 });
  for (const t of tools) {
    const p = paymentFor.get(t.id);
    const day = byDay.get(new Date(p?.created_at ?? t.created_at).toISOString().slice(0, keyLen));
    if (!day) continue;
    day[(t as { moderation?: string }).moderation === 'not_a_fit' ? 'other' : 'dev'] += p ? Number(p.amount_total) : LIST_PRICE;
  }
  const slots = Array.from(byDay, ([key, v]) => ({ key, ...v, total: v.dev + v.other }));
  const dev = slots.reduce((s, d) => s + d.dev, 0);
  const other = slots.reduce((s, d) => s + d.other, 0);
  const total = dev + other;
  const max = Math.max(1, ...slots.map(d => d.total));
  const devShare = total ? (dev / total) * 100 : 0;

  return (
    <div className="mt-16">
      <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Revenue</h2>
      <p className="mt-2 text-sm text-slate-500">
        Paid launches (isPaid), {hourly ? 'last 24 hours' : `last ${days} days`}. Stripe amounts where recorded (coupons count as what was paid), else the ${LIST_PRICE / 100} list price.
      </p>

      <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 font-mono">
        {[
          { label: 'total_revenue', value: total, hint: `${tools.length} paid launches` },
          { label: 'dev_tools', value: dev, hint: `${devShare.toFixed(0)}%` },
          { label: 'other_tools', value: other, hint: `${total ? (100 - devShare).toFixed(0) : 0}%` },
        ].map(t => (
          <div key={t.label} className="bg-slate-900 px-4 py-4">
            <dt className="text-[11px] text-slate-500">{t.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-50">{usd(t.value)}</dd>
            <dd className="mt-1 text-[11px] text-slate-500">{t.hint}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_180px]">
        <div>
          <SectionLabel title={`Revenue per ${hourly ? 'hour' : 'day'}`} hint={hourly ? 'last 24 hours, UTC' : `last ${days} days, UTC`} />
          <div className="mt-4 flex h-40 items-end gap-[2px]" role="img" aria-label="Revenue over time, dev tools and other tools">
            {slots.map(d => (
              <div key={d.key} className="group relative flex h-full flex-1 items-end">
                <div className="flex w-full flex-col overflow-hidden rounded-t-[3px] group-hover:brightness-125" style={{ height: `${d.total ? Math.max(1, (d.total / max) * 100) : 0}%` }}>
                  <div className={OTHER.bar} style={{ flexGrow: d.other }} />
                  <div className={DEV.bar} style={{ flexGrow: d.dev }} />
                </div>
                {!d.total && <div className="absolute bottom-0 h-px w-full bg-slate-800" />}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 group-hover:block">
                  <div className="text-slate-500">{hourly ? `${d.key.replace('T', ' ')}:00 UTC` : d.key}</div>
                  {usd(d.total)} · dev {usd(d.dev)} · other {usd(d.other)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-600">
            {[0, Math.floor(count / 4), Math.floor(count / 2), Math.floor((count * 3) / 4), count - 1].map(i => (
              <span key={i}>{hourly ? `${slots[i]?.key.slice(11)}:00` : slots[i]?.key.slice(5)}</span>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel title="Share" hint={hourly ? '24h' : `${days}d`} />
          <div
            className="mx-auto mt-4 h-36 w-36 rounded-full"
            role="img"
            aria-label={`Dev tools ${devShare.toFixed(0)}%, other tools ${(100 - devShare).toFixed(0)}%`}
            style={{ background: total ? `conic-gradient(${DEV.color} 0 ${devShare}%, ${OTHER.color} ${devShare}% 100%)` : '#1e293b' }}
          />
          <ul className="mt-4 space-y-1 font-mono text-[11px] text-slate-400">
            {[
              { ...DEV, v: dev },
              { ...OTHER, v: other },
            ].map(s => (
              <li key={s.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
                <span>
                  {usd(s.v)} · {total ? ((s.v / total) * 100).toFixed(0) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
