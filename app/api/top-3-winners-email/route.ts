import ApiService from '@/utils/supabase/services/api';
import { renderTop3WinnersEmail } from '@/utils/email-templates/render-top-3-winners-email';
import { sendMarsxCampaign } from '@/utils/server/marsxMailer';
import { cronPeriod, cronRoute, sendOnce } from '@/utils/server/cronJob';

// Cron-triggered (vercel.json, Tuesdays): never prerender at build time.
export const dynamic = 'force-dynamic';

export const GET = cronRoute('top-3-winners-email', async () => {
  const apiService = new ApiService();
  const today = new Date();
  const calendarYear = today.getFullYear();
  const currentWeek = await apiService.getWeekNumber(today, 2);
  const weekStartDay = 2;

  // get_prev_launch_weeks uses week <= _launch_week, so passing currentWeek often
  // returns this week's tools. Past-week email must cap at the previous launch week.
  const pastWinnersYear = currentWeek > 1 ? calendarYear : calendarYear - 1;
  const maxPastWeek = currentWeek > 1 ? currentWeek - 1 : 53;

  const weeks = await apiService.getPrevLaunchWeeks(pastWinnersYear, weekStartDay, maxPastWeek, 1);
  if (!weeks?.length) return { week: maxPastWeek, year: pastWinnersYear, sent: 'nothing to send' };

  const { products, week } = weeks[0];
  const html = renderTop3WinnersEmail(
    products.slice(0, 3).map(p => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      logo_url: p.logo_url,
    })),
  );

  const sent = await sendOnce('top-3-winners-email', cronPeriod(), '', () =>
    sendMarsxCampaign("🏆 Meet This Week's Top 3 Tools on DevHunt!", html),
  );
  return { week, year: pastWinnersYear, sent };
});
