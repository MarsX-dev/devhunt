// Submit/launch funnel (pure helpers, tested). Browser steps go through /api/funnel
// (components/../funnelClient.ts); server steps are recorded by utils/server/funnel.ts.

export const FUNNEL_STEPS = [
  { step: 'submit_click', label: 'clicked Submit', side: 'client' },
  { step: 'submit_view', label: 'opened submit page', side: 'client' },
  { step: 'url_entered', label: 'entered a URL', side: 'client' },
  { step: 'manual_form', label: 'chose manual form', side: 'client' },
  { step: 'import_done', label: 'site imported', side: 'client' },
  { step: 'form_submitted', label: 'submitted the form', side: 'client' },
  { step: 'tool_created', label: 'tool created', side: 'server' },
  { step: 'launch_view', label: 'saw launch options', side: 'client' },
  { step: 'week_picked', label: 'picked a paid week', side: 'client' },
  { step: 'free_chosen', label: 'kept free launch', side: 'client' },
  { step: 'checkout_started', label: 'opened checkout', side: 'server' },
  { step: 'checkout_canceled', label: 'came back unpaid', side: 'client' },
  { step: 'payment_failed', label: 'payment failed', side: 'server' },
  { step: 'paid', label: 'paid', side: 'server' },
  // Sponsor ads (reported separately: the submit funnel report skips 'ad_*' steps)
  { step: 'ad_view', label: 'opened /advertise', side: 'client' },
  { step: 'ad_generate_click', label: 'clicked Generate', side: 'client' },
  { step: 'ad_signin_prompt', label: 'asked to sign in', side: 'client' },
  { step: 'ad_generated', label: 'ad generated', side: 'server' },
  { step: 'ad_blocked', label: 'ad refused (JEV)', side: 'server' },
  { step: 'ad_checkout_started', label: 'opened checkout', side: 'server' },
  { step: 'ad_checkout_canceled', label: 'came back unpaid', side: 'client' },
  { step: 'ad_paid', label: 'paid', side: 'server' },
  { step: 'ad_edited', label: 'edited a live ad', side: 'server' },
  { step: 'ad_edit_refused', label: 'edit refused (JEV)', side: 'server' },
  { step: 'ad_canceled', label: 'canceled future months', side: 'server' },
  { step: 'ad_refunded', label: 'refunded', side: 'server' },
] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number]['step'];
export const CLIENT_STEPS = new Set<string>(FUNNEL_STEPS.filter(s => s.side === 'client').map(s => s.step));

// The main path for conversion rates (alternatives like manual_form/free_chosen are shown beside it).
export const MAIN_PATH: FunnelStep[] = ['submit_click', 'submit_view', 'url_entered', 'form_submitted', 'tool_created', 'launch_view', 'checkout_started', 'paid'];

export const AD_PATH: FunnelStep[] = ['ad_view', 'ad_generate_click', 'ad_generated', 'ad_checkout_started', 'ad_paid'];

export const VISITOR_COOKIE = 'dh_vid';
export const SESSION_COOKIE = 'dh_sid';

export const deviceFrom = (userAgent: string | null) =>
  !userAgent ? null : /ipad|tablet/i.test(userAgent) ? 'tablet' : /mobi|android|iphone/i.test(userAgent) ? 'mobile' : 'desktop';

const ID = /^[a-z0-9]{8,40}$/i;
export const cleanId = (value: unknown) => (typeof value === 'string' && ID.test(value) ? value : null);

// Keeps event props small and flat: strings (trimmed), numbers, booleans, and short string lists.
export function cleanProps(props: unknown): Record<string, unknown> {
  if (!props || typeof props !== 'object' || Array.isArray(props)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>).slice(0, 20)) {
    if (!/^[a-z_]{1,30}$/.test(key)) continue;
    if (typeof value === 'string') out[key] = value.trim().slice(0, 300);
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'boolean') out[key] = value;
    else if (Array.isArray(value)) out[key] = value.filter(v => typeof v === 'string' || typeof v === 'number').slice(0, 10).map(v => String(v).slice(0, 60));
  }
  return out;
}

export function cleanUtm(search: unknown): Record<string, string> | null {
  if (!search || typeof search !== 'object') return null;
  const out: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'ref']) {
    const v = (search as Record<string, unknown>)[key];
    if (typeof v === 'string' && v.trim()) out[key] = v.trim().slice(0, 80);
  }
  return Object.keys(out).length ? out : null;
}

// ── Daily Discord report (plain text, fixed width) ──────────────────────────────────────────

export interface ReportInput {
  date: string; // YYYY-MM-DD (UTC) the report covers
  day: Record<string, number>; // step -> journeys that day
  week: Record<string, number>; // step -> journeys over the last 7 days
  revenueDay: number;
  revenueWeek: number;
  traffic?: { visitors: number; pageviews: number; newVisitors: number; countries: { country: string; visitors: number }[] } | null;
  newUsers?: number | null;
  dropped?: { who: string; tool: string | null; step: string; country: string | null }[];
}

const bar = (n: number, max: number, width = 16) => (max ? '█'.repeat(Math.round((n / max) * width)) || (n ? '▏' : '') : '');
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : '–');
const pad = (s: string | number, len: number) => String(s).padEnd(len);
const padL = (s: string | number, len: number) => String(s).padStart(len);
const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

export function formatDailyReport(r: ReportInput): string {
  const label = (step: string) => FUNNEL_STEPS.find(s => s.step === step)?.label ?? step;
  const max = Math.max(1, ...MAIN_PATH.map(s => r.day[s] ?? 0));
  const lines: string[] = [`DevHunt daily report · ${r.date} (UTC)`, ''];

  if (r.traffic) {
    lines.push(
      `traffic   ${r.traffic.visitors.toLocaleString('en-US')} visitors · ${r.traffic.pageviews.toLocaleString('en-US')} page views · ${r.traffic.newVisitors.toLocaleString('en-US')} new${
        r.newUsers != null ? ` · ${r.newUsers} sign-ups` : ''
      }`,
    );
    const top = r.traffic.countries.slice(0, 6);
    const total = Math.max(1, r.traffic.visitors);
    if (top.length) lines.push(`countries ${top.map(c => `${c.country} ${pct(c.visitors, total)}`).join(' · ')}`);
    lines.push('');
  }

  lines.push(`submit funnel            ${padL('day', 5)} ${pad('', 16)} ${padL('step%', 6)}  ${padL('7d', 5)}`);
  let prev = 0;
  MAIN_PATH.forEach((step, i) => {
    const n = r.day[step] ?? 0;
    lines.push(`${pad(label(step), 24)} ${padL(n, 5)} ${pad(bar(n, max), 16)} ${padL(i ? pct(n, prev) : '', 6)}  ${padL(r.week[step] ?? 0, 5)}`);
    prev = n;
  });
  const side = ['manual_form', 'free_chosen', 'checkout_canceled', 'payment_failed']
    .map(step => `${label(step)} ${r.day[step] ?? 0} (7d ${r.week[step] ?? 0})`)
    .join(' · ');
  lines.push('', `also      ${side}`);
  lines.push(`revenue   ${money(r.revenueDay)} that day · ${money(r.revenueWeek)} last 7 days`);

  if (r.dropped?.length) {
    lines.push('', 'dropped at checkout:');
    for (const d of r.dropped.slice(0, 8)) lines.push(`  - ${d.who}${d.tool ? ` (${d.tool})` : ''} · ${label(d.step)}${d.country ? ` · ${d.country}` : ''}`);
  }
  return lines.join('\n');
}
