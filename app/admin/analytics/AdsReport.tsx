import Link from 'next/link';
import moment from 'moment';
import SectionLabel from '@/components/ui/SectionLabel';
import { AD_KINDS, AD_PRODUCTS, isRecurring, planPrice, type AdKind, type AdPlan } from '@/utils/ads';
import { AD_PATH, FUNNEL_STEPS } from '@/utils/funnel';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

interface LiveAd {
  id: number;
  kind: AdKind;
  slot: number | null;
  name: string;
  tagline: string;
  url: string;
  plan: AdPlan;
  status: 'active' | 'canceling';
  started_at: string | null;
  current_period_end: string | null;
  editions_left: number | null;
  email: string | null;
  impressions: number;
  clicks: number;
  impressions_range: number;
  clicks_range: number;
}
interface AdAnalytics {
  steps: Record<string, number>;
  revenue: number;
  sources: { source: string; n: number }[];
  advertise_pageviews: number;
  generated: { created_at: string; url: string; name: string; kinds: AdKind[]; blocked: boolean; paid: boolean; live: boolean; topic: string | null; email: string | null }[];
  generated_totals: { generations: number; advertisers: number; blocked: number; paid: number };
  checkouts: number;
  live: LiveAd[];
  daily: { day: string; impressions: number; clicks: number }[];
  ended: number;
  refunded: number;
}

const label = (step: string) => FUNNEL_STEPS.find(s => s.step === step)?.label ?? step;
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : '–');
const ctr = (clicks: number, views: number) => (views ? `${((clicks / views) * 100).toFixed(2)}%` : '–');
const fmt = (n: number) => Number(n).toLocaleString('en-US');
const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};
const SOURCE_LABELS: Record<string, string> = {
  'open-rail': '"your ad here" sidebar card',
  'open-inline': '"your ad here" row in a list',
  'open-strip': '"your ad here" mobile strip',
  'free-from': '"free from" date on a sidebar card',
};

// Sponsor ads for the analytics page (DevHunt team only): funnel, sources, everything generated,
// live ads and their numbers. `days` = 1 means the last 24 hours.
export default async function AdsReport({ days }: { days: number }) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await serviceClient.rpc('get_ad_analytics' as never, { _since: since } as never);
  const a = data as unknown as AdAnalytics | null;
  if (!a) return null;
  const range = days === 1 ? 'last 24 hours' : `last ${days} days`;

  const live = a.live;
  const mrr = live.filter(ad => ad.status === 'active' && isRecurring(ad.kind, ad.plan)).reduce((sum, ad) => sum + planPrice(ad.kind), 0);
  const impressions = a.daily.reduce((sum, d) => sum + Number(d.impressions), 0);
  const clicks = a.daily.reduce((sum, d) => sum + Number(d.clicks), 0);
  const tiles = [
    { label: 'live_ads', value: fmt(live.length), hint: AD_KINDS.map(k => `${k} ${live.filter(ad => ad.kind === k).length}/${AD_PRODUCTS[k].slots}`).join(' · ') },
    { label: 'mrr_list_price', value: `$${fmt(mrr)}`, hint: 'active monthly ads, before coupons' },
    { label: 'ad_revenue', value: `$${fmt(a.revenue)}`, hint: `paid in checkout, ${range}` },
    { label: 'impressions', value: fmt(impressions), hint: `${fmt(clicks)} clicks · ${ctr(clicks, impressions)} CTR` },
  ];

  const top = a.steps[AD_PATH[0]] ?? 0;
  const max = Math.max(1, ...AD_PATH.map(s => a.steps[s] ?? 0));
  const maxDay = Math.max(1, ...a.daily.map(d => Number(d.impressions)));
  const g = a.generated_totals;

  return (
    <div className="mt-16 space-y-12">
      <div>
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Sponsor ads</h2>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 font-mono sm:grid-cols-4">
          {tiles.map(t => (
            <div key={t.label} className="bg-slate-900 px-4 py-4">
              <dt className="text-[11px] text-slate-500">{t.label}</dt>
              <dd className="mt-1 text-xl font-semibold text-slate-50">{t.value}</dd>
              <dd className="mt-1 text-[11px] text-slate-500">{t.hint}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <SectionLabel title="Ad funnel" hint={`${range} · unique visitors per step · tracked since Sep 29, 2026`} />
        <ol className="mt-2 font-mono text-xs">
          {AD_PATH.map((step, i) => {
            const n = a.steps[step] ?? 0;
            const prev = i ? a.steps[AD_PATH[i - 1]] ?? 0 : 0;
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
          {['ad_signin_prompt', 'ad_blocked', 'ad_checkout_canceled', 'ad_edited', 'ad_edit_refused', 'ad_canceled', 'ad_refunded']
            .map(s => `${label(s)} ${fmt(a.steps[s] ?? 0)}`)
            .join(' · ')}
        </p>
        <p className="mt-1 font-mono text-[11px] text-slate-500">
          from the database ({range}): /advertise page views {fmt(a.advertise_pageviews)} · generations {fmt(g.generations)} by {fmt(g.advertisers)}{' '}
          advertisers · refused {fmt(g.blocked)} · checkouts {fmt(a.checkouts)} · paid {fmt(g.paid)} · ended {fmt(a.ended)} · refunded {fmt(a.refunded)}
        </p>
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <SectionLabel title="Where /advertise visitors come from" hint="unique visitors" />
          {a.sources.length ? (
            <ul className="mt-3 space-y-1 font-mono text-xs">
              {a.sources.map(s => (
                <li key={s.source} className="flex justify-between gap-3 border-b border-slate-800/70 py-1.5">
                  <span className="truncate text-slate-300">{SOURCE_LABELS[s.source] ?? s.source}</span>
                  <span className="text-slate-400">{fmt(s.n)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Nothing yet. Tracked from now on.</p>
          )}
        </div>
        <div>
          <SectionLabel title="Impressions per day" hint={`all ads · ${range}`} />
          {a.daily.length ? (
            <div className="mt-4 flex h-32 items-end gap-[2px]" role="img" aria-label="Ad impressions per day">
              {a.daily.map(d => (
                <div key={d.day} className="group relative flex h-full flex-1 items-end">
                  <div className="w-full rounded-t-[4px] bg-orange-400/80 group-hover:bg-orange-300" style={{ height: `${Math.max(1, (Number(d.impressions) / maxDay) * 100)}%` }} />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 group-hover:block">
                    <div className="text-slate-500">{d.day}</div>
                    {fmt(d.impressions)} impressions · {fmt(d.clicks)} clicks · {ctr(Number(d.clicks), Number(d.impressions))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No impressions in this period.</p>
          )}
        </div>
      </div>

      <div>
        <SectionLabel title="Live ads" hint={`impressions and clicks: ${range} / all time`} />
        {live.length ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] font-mono text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 font-normal">ad</th>
                  <th className="py-2 font-normal">placement</th>
                  <th className="py-2 text-right font-normal">impr.</th>
                  <th className="py-2 text-right font-normal">clicks</th>
                  <th className="py-2 text-right font-normal">CTR</th>
                  <th className="py-2 text-right font-normal">status</th>
                </tr>
              </thead>
              <tbody>
                {live.map(ad => (
                  <tr key={ad.id} className="border-t border-slate-800/70 align-top text-slate-300">
                    <td className="py-2 pr-3">
                      <a href={ad.url} target="_blank" rel="noopener" className="text-slate-100 hover:underline">
                        {ad.name}
                      </a>
                      <span className="block max-w-[16rem] truncate text-slate-500">{ad.tagline}</span>
                      <span className="block text-slate-600">{ad.email}</span>
                    </td>
                    <td className="py-2 pr-3">
                      {AD_PRODUCTS[ad.kind]?.title}
                      {ad.slot ? ` #${ad.slot}` : ''}
                      <span className="block text-slate-500">{ad.plan === 'single' ? '1 edition' : `$${planPrice(ad.kind)}/mo`}</span>
                    </td>
                    <td className="py-2 text-right">
                      {fmt(ad.impressions_range)}
                      <span className="block text-slate-600">{fmt(ad.impressions)}</span>
                    </td>
                    <td className="py-2 text-right">
                      {fmt(ad.clicks_range)}
                      <span className="block text-slate-600">{fmt(ad.clicks)}</span>
                    </td>
                    <td className="py-2 text-right text-orange-300">
                      {ctr(ad.clicks_range, ad.impressions_range)}
                      <span className="block text-slate-600">{ctr(ad.clicks, ad.impressions)}</span>
                    </td>
                    <td className="py-2 text-right">
                      <span className={ad.status === 'active' ? 'text-green-400' : 'text-amber-400'}>{ad.status === 'active' ? 'live' : 'canceling'}</span>
                      <span className="block text-slate-500">
                        {ad.started_at ? `since ${moment(ad.started_at).format('MMM D')}` : ''}
                        {ad.current_period_end ? ` · ${ad.status === 'active' ? 'renews' : 'ends'} ${moment(ad.current_period_end).format('MMM D')}` : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No live ads.</p>
        )}
      </div>

      <div>
        <SectionLabel title="Ads generated" hint={`every URL entered on /advertise · ${range}`} />
        {a.generated.length ? (
          <ul className="mt-2 divide-y divide-slate-800/70 text-xs">
            {a.generated.map(ad => (
              <li key={`${ad.created_at}-${ad.url}`} className="grid gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[7rem_1fr_auto]">
                <span className="font-mono text-slate-500">{moment(ad.created_at).fromNow()}</span>
                <span className="min-w-0 text-slate-300">
                  <a href={ad.url} target="_blank" rel="noopener nofollow" className="text-slate-100 underline decoration-slate-700 underline-offset-2">
                    {host(ad.url)}
                  </a>
                  <span className="text-slate-500"> · {ad.name}</span>
                  {ad.email && <span className="block text-slate-500">{ad.email}</span>}
                </span>
                <span className="font-mono text-slate-400 sm:text-right">
                  {ad.kinds.join(' + ')}
                  <span className="block">
                    {ad.blocked ? (
                      <span className="text-red-300">refused{ad.topic ? `: ${ad.topic}` : ''}</span>
                    ) : ad.live ? (
                      <span className="text-green-400">live ✓</span>
                    ) : ad.paid ? (
                      <span className="text-orange-300">paid, ended</span>
                    ) : (
                      <span className="text-slate-500">not paid</span>
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No ads generated in this period.</p>
        )}
        <p className="mt-3 font-mono text-[11px] text-slate-600">
          Manage your own ads in <Link href="/account/advertise" className="underline">My ads</Link>.
        </p>
      </div>
    </div>
  );
}
