import { unstable_cache } from 'next/cache';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { launchWeekDate } from '@/utils/homeData';
import { renderNewToolsLaunchReminderEmail } from '@/utils/email-templates/render-new-tools-launch-reminder-email';

export const dynamic = 'force-dynamic';

// The launch-week newsletter as subscribers get it, with this week's tools (the house ad in the
// sponsor slot). Shown on the paid launch page when a maker expands "Preview the email".
const getPreview = unstable_cache(
  async () => {
    const products = new ProductsService(createBrowserClient());
    const today = launchWeekDate();
    const week = await products.getWeekNumber(today, 2);
    const weeks = await products.getPrevLaunchWeeks(today.getFullYear(), 2, week, 1);
    const tools = (weeks[0]?.products ?? []).map(p => ({ slug: p.slug, name: p.name, description: p.description, logo_url: p.logo_url }));
    return renderNewToolsLaunchReminderEmail(tools);
  },
  ['newsletter-preview-v1'],
  { revalidate: 3600 },
);

export async function GET() {
  try {
    return new Response(await getPreview(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600', 'X-Robots-Tag': 'noindex' },
    });
  } catch (error) {
    console.error('newsletter preview:', error);
    return new Response('Preview unavailable', { status: 500 });
  }
}
