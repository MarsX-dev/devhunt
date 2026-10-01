import ApiService from '@/utils/supabase/services/api';
import winnersPersonalCongratsEmailTemplate from '@/utils/email-templates/winners-personal-congrats-email-template';
import { Resend } from 'resend';
import { cronPeriod, cronRoute, sendOnce } from '@/utils/server/cronJob';

// Cron-triggered (vercel.json, Tuesdays): never prerender at build time.
export const dynamic = 'force-dynamic';

const JOB = 'winners-personal-congrats-email';

export const GET = cronRoute(JOB, async () => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const apiService = new ApiService();
  const today = new Date();
  const currentWeek = await apiService.getWeekNumber(today, 2);
  const year = today.getFullYear();

  const weeks = await apiService.getPrevLaunchWeeks(year, 2, currentWeek, 1);
  if (!weeks?.length) return { week: currentWeek, year, sent: 'nothing to send' };

  const { products, week } = weeks[0];
  const ranks = ['1st', '2nd', '3rd'];
  const period = cronPeriod();
  const results: Record<string, string> = {};

  // One at a time and awaited: each winner is recorded separately, so a retry only sends to the ones missed.
  for (let idx = 0; idx < Math.min(products.length, 3); idx++) {
    const p = products[idx] as any;
    const rank = ranks[idx];
    const html = winnersPersonalCongratsEmailTemplate
      .replace('{{namehere}}', p.email.split('@')[0] || '')
      .replace('{{rankhere}}', rank || '')
      .replace('{{ranknumhere}}', String(idx + 1))
      .replace('{{idhere}}', String(p.id));
    results[rank] = await sendOnce(JOB, period, p.email, async () => {
      const { error } = await resend.emails.send({
        from: 'DevHunt <hey@devhunt.org>',
        to: process.env.NODE_ENV == 'development' ? ['sididev3@gmail.com', 'nazar@marsx.dev'] : p.email,
        subject: `Celebrating your ${rank} remarkable place win on DevHunt 🎉`,
        replyTo: 'hey@devhunt.org',
        html,
      });
      if (error) throw new Error(`Resend (${rank}): ${error.message}`);
    });
  }
  return { week, year, sent: results };
});
