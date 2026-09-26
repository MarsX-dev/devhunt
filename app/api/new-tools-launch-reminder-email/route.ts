import ApiService from '@/utils/supabase/services/api';
import { simpleToolApiDtoFormatter } from '@/pages/api/api-formatters';
import { renderNewToolsLaunchReminderEmail } from '@/utils/email-templates/render-new-tools-launch-reminder-email';
import { isAuthorizedCron } from '@/utils/cronAuth';
import { NextResponse } from 'next/server';
import axios from 'axios';

// Cron-triggered: never prerender at build time.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    if (!isAuthorizedCron(req)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const apiService = new ApiService();
    const today = new Date();
    const currentWeek = await apiService.getWeekNumber(today, 2);
    const year = today.getFullYear();

    const weeks = await apiService.getPrevLaunchWeeks(year, 2, currentWeek, 1);
    if (!weeks?.length) {
      const html = renderNewToolsLaunchReminderEmail([]);
      return NextResponse.json({
        week: currentWeek,
        year,
        tools: [],
        html,
      });
    }

    const { products, week } = weeks[0];
    const tools = products.map(simpleToolApiDtoFormatter);
    const html = renderNewToolsLaunchReminderEmail(
      products.map(p => ({
        slug: p.slug,
        name: p.name,
        description: p.description,
        logo_url: p.logo_url,
      })),
    );

    const { data } = await axios.post(
      'https://xuqkmyeuqfvucdo6gupjh7x6df8ohj6b.saasemailer.com/api/v1/devhunt.org/campaigns',
      {
        name: '🏆 Who Will Be Tool of The Week?',
        subject: '🏆 Who Will Be Tool of The Week?',
        audienceId: process.env.MARSX_MAILER_AUDIENCE_ID || '69f455ab8aee3505f37b2c29',
        content: html,
        topicName: 'DevHunt',
        sender: {
          name: 'DevHunt',
          domainFrom: 'hey',
          from: 'hey@devhunt.org',
          emailFrom: 'hey@devhunt.org',
          replyTo: 'hey@devhunt.org',
        },
      },
      {
        headers: {
          'mars-authorization': process.env.MARSX_MAILER_AUTH,
        },
      },
    );

    await axios.post(
      `https://xuqkmyeuqfvucdo6gupjh7x6df8ohj6b.saasemailer.com/api/v1/devhunt.org/campaigns/${data._id}/schedule`,
      {},
      {
        headers: {
          'mars-authorization': process.env.MARSX_MAILER_AUTH,
        },
      },
    );

    console.log('new-tools-launch-reminder-email: Campaign scheduled successfully');

    return NextResponse.json({ success: true });
    // return new NextResponse(html, {
    //   status: 200,
    //   headers: {
    //     'Content-Type': 'text/html; charset=utf-8',
    //   },
    // });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ data: error }, { status: 500 });
  }
}
