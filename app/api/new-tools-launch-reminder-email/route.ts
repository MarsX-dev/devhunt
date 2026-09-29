import ApiService from '@/utils/supabase/services/api';
import { renderNewToolsLaunchReminderEmail } from '@/utils/email-templates/render-new-tools-launch-reminder-email';
import { sendMarsxCampaign } from '@/utils/server/marsxMailer';
import { cronPeriod, cronRoute, sendOnce } from '@/utils/server/cronJob';
import { newsletterSent, newsletterSponsor } from '@/utils/server/ads';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

// Cron-triggered (vercel.json, Wednesdays): never prerender at build time.
export const dynamic = 'force-dynamic';

export const GET = cronRoute('new-tools-launch-reminder-email', async () => {
  const apiService = new ApiService();
  const today = new Date();
  const currentWeek = await apiService.getWeekNumber(today, 2);
  const year = today.getFullYear();

  const weeks = await apiService.getPrevLaunchWeeks(year, 2, currentWeek, 1);
  if (!weeks?.length) return { week: currentWeek, year, sent: 'nothing to send' };

  const { products, week, startDate, endDate } = weeks[0];
  const sponsor = await newsletterSponsor();
  // Paid "other" tools launching this week get a line too (free ones are on the home page only).
  const { data: others } = await serviceClient
    .from('products')
    .select('slug, name, description, logo_url')
    .eq('moderation' as never, 'not_a_fit')
    .eq('isPaid', true)
    .eq('deleted', false)
    .gte('launch_start', startDate.toISOString())
    .lte('launch_start', endDate.toISOString())
    .order('created_at', { ascending: true });
  const html = renderNewToolsLaunchReminderEmail(
    products.map(p => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      logo_url: p.logo_url,
    })),
    sponsor ?? undefined,
    others ?? [],
  );

  const sent = await sendOnce('new-tools-launch-reminder-email', cronPeriod(), '', () =>
    sendMarsxCampaign('🏆 Who Will Be Tool of The Week?', html),
  );
  if (sent === 'sent' && sponsor) await newsletterSent(sponsor.adId);
  return { week, year, sent, sponsor: sponsor?.adId ?? null };
});
