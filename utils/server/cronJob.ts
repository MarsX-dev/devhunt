import { NextResponse } from 'next/server';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { isAuthorizedCron } from '@/utils/cronAuth';
import { reportCronProblem } from '@/utils/server/discord';

// Scheduled jobs live in vercel.json and run a few times in a row (e.g. 08:00, 09:00, 10:00 UTC) as
// retries. Each send is recorded in cron_sends, so later runs skip what an earlier run already sent.

// Today's UTC date: all retries of a job on the same day share one period.
export const cronPeriod = () => new Date().toISOString().slice(0, 10);

// Sends once per (job, period, key). A crash mid-send leaves the row 'running': it is not resent
// (it may have gone out) but reported so a human can check.
export async function sendOnce(job: string, period: string, key: string, send: () => Promise<void>): Promise<'sent' | 'skipped'> {
  const { error } = await serviceClient.from('cron_sends').insert({ job, period, key });
  if (error) {
    if (error.code !== '23505') throw new Error(`cron_sends claim failed: ${error.message}`);
    const { data } = await serviceClient.from('cron_sends').select('status, started_at').match({ job, period, key }).single();
    if (data?.status === 'running' && Date.now() - new Date(data.started_at).getTime() > 15 * 60_000) {
      await reportCronProblem(job, `\`${key || 'campaign'}\` (${period}) was left half-sent by a crashed run, not resent. Check it went out, then \`DELETE FROM cron_sends WHERE job = '${job}' AND period = '${period}' AND key = '${key}';\` to allow a resend.`);
    }
    return 'skipped';
  }
  try {
    await send();
  } catch (err) {
    await serviceClient.from('cron_sends').delete().match({ job, period, key }); // free it for the next retry
    throw err;
  }
  await serviceClient.from('cron_sends').update({ status: 'done', done_at: new Date().toISOString() }).match({ job, period, key });
  return 'sent';
}

// Wraps a cron route: auth, JSON result, and a Discord alert on failure (the next scheduled run retries).
export function cronRoute(job: string, run: () => Promise<Record<string, unknown>>) {
  return async (req: Request) => {
    if (!isAuthorizedCron(req)) return new NextResponse('Unauthorized', { status: 401 });
    try {
      const result = await run();
      console.log(`[cron] ${job}`, JSON.stringify(result));
      return NextResponse.json({ success: true, ...result });
    } catch (err: any) {
      const message = err?.response?.data ? JSON.stringify(err.response.data) : err?.message ?? String(err);
      console.error(`[cron] ${job} failed:`, message);
      await reportCronProblem(job, `run failed (${new Date().toISOString().slice(11, 16)} UTC), the next scheduled run retries: ${message.slice(0, 1500)}`);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  };
}
