import ApiService from '@/utils/supabase/services/api';
import { renderNewToolsLaunchReminderEmail } from '@/utils/email-templates/render-new-tools-launch-reminder-email';
import { sendMarsxCampaign } from '@/utils/server/marsxMailer';
import { cronPeriod, cronRoute, sendOnce } from '@/utils/server/cronJob';
import { newsletterSponsor } from '@/utils/server/ads';

// Cron-triggered (vercel.json, Wednesdays): never prerender at build time.
export const dynamic = 'force-dynamic';

export const GET = cronRoute('new-tools-launch-reminder-email', async () => {
  const apiService = new ApiService();
  const today = new Date();
  const currentWeek = await apiService.getWeekNumber(today, 2);
  const year = today.getFullYear();

  const weeks = await apiService.getPrevLaunchWeeks(year, 2, currentWeek, 1);
  if (!weeks?.length) return { week: currentWeek, year, sent: 'nothing to send' };

  const { products, week } = weeks[0];
  const html = renderNewToolsLaunchReminderEmail(
    products.map(p => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      logo_url: p.logo_url,
    })),
    (await newsletterSponsor()) ?? undefined,
  );

  const sent = await sendOnce('new-tools-launch-reminder-email', cronPeriod(), '', () =>
    sendMarsxCampaign('🏆 Who Will Be Tool of The Week?', html),
  );
  return { week, year, sent };
});
