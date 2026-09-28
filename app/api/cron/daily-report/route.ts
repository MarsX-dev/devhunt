import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/utils/cronAuth';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { formatDailyReport, FUNNEL_STEPS, type ReportInput } from '@/utils/funnel';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const dayStart = (offsetDays: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
};

// Daily text report to Discord (Vercel Cron, see vercel.json): yesterday's traffic, the submit
// funnel (yesterday and last 7 days), revenue and who dropped off at checkout.
// Webhook: DISCORD_REPORT_WEBHOOK, else the new-tool channel. ?dry=1 returns the text without posting.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const from = dayStart(-1);
  const to = dayStart(0);
  const [day, week, traffic, stats] = await Promise.all([
    serviceClient.rpc('get_funnel' as never, { _since: from.toISOString(), _until: to.toISOString() } as never),
    serviceClient.rpc('get_funnel' as never, { _since: dayStart(-7).toISOString(), _until: to.toISOString() } as never),
    serviceClient.from('analytics_daily' as never).select('country, pageviews, visitors, new_visitors').eq('day', from.toISOString().slice(0, 10)),
    serviceClient.rpc('get_site_stats' as never),
  ]);
  const d = day.data as any;
  const w = week.data as any;
  const rows = (traffic.data ?? []) as { country: string; pageviews: number; visitors: number; new_visitors: number }[];
  const sum = (key: 'pageviews' | 'visitors' | 'new_visitors') => rows.reduce((n, r) => n + Number(r[key]), 0);

  const input: ReportInput = {
    date: from.toISOString().slice(0, 10),
    day: d?.steps ?? {},
    week: w?.steps ?? {},
    revenueDay: Number(d?.revenue ?? 0),
    revenueWeek: Number(w?.revenue ?? 0),
    traffic: rows.length
      ? {
          visitors: sum('visitors'),
          pageviews: sum('pageviews'),
          newVisitors: sum('new_visitors'),
          // A country's counts are spread over several rows (track_pageview shards).
          countries: Object.entries(
            rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.country]: (acc[r.country] ?? 0) + Number(r.visitors) }), {}),
          )
            .map(([country, visitors]) => ({ country, visitors }))
            .sort((a, b) => b.visitors - a.visitors),
        }
      : null,
    newUsers: (stats.data as any)?.users_today ?? null,
    dropped: ((d?.journeys ?? []) as any[])
      .filter(j => j.steps.includes('checkout_started') && !j.steps.includes('paid'))
      .map(j => ({
        who: j.full_name || j.username || j.email || 'anonymous',
        tool: j.tool,
        step: j.steps.includes('payment_failed') ? 'payment_failed' : j.steps.includes('checkout_canceled') ? 'checkout_canceled' : 'checkout_started',
        country: j.country,
      })),
  };
  const text = formatDailyReport(input);
  if (new URL(req.url).searchParams.get('dry') === '1') return new NextResponse(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });

  const webhook = process.env.DISCORD_REPORT_WEBHOOK ?? process.env.DISCORD_TOOL_WEBHOOK ?? process.env.DISCOR_TOOL_WEBHOOK;
  if (!webhook) return NextResponse.json({ error: 'No Discord webhook configured' }, { status: 503 });
  // Discord messages max out at 2,000 characters: split on lines, each part in a code block.
  const parts: string[] = [];
  for (const line of text.split('\n')) {
    const last = parts[parts.length - 1];
    if (last !== undefined && last.length + line.length + 1 < 1880) parts[parts.length - 1] = `${last}\n${line}`;
    else parts.push(line);
  }
  // Discord's answer is checked: a wrong or deleted webhook fails the run (visible in Vercel's cron log)
  // instead of reporting success.
  for (const part of parts) {
    const res = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `\`\`\`\n${part}\n\`\`\``, allowed_mentions: { parse: [] } }) });
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300);
      console.error(`[cron] daily-report: Discord answered ${res.status}: ${detail}`);
      return NextResponse.json({ error: `Discord answered ${res.status}`, detail }, { status: 502 });
    }
  }
  const channel = process.env.DISCORD_REPORT_WEBHOOK ? 'report channel' : 'new-tool channel';
  console.log(`[cron] daily-report posted ${parts.length} message(s) to the ${channel}`);
  return NextResponse.json({ sent: parts.length, channel, steps: FUNNEL_STEPS.length });
}
