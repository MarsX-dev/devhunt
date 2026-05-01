import ApiService from '@/utils/supabase/services/api';
import { simpleToolApiDtoFormatter } from '@/pages/api/api-formatters';
import { renderTop3WinnersEmail } from '@/utils/email-templates/render-top-3-winners-email';
import { NextResponse } from 'next/server';
import axios from 'axios';
import { isAuthorizedCron } from '@/app/api/new-tools-launch-reminder-email/route';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not allowed in production' });
  }

  try {
    if (!isAuthorizedCron(req)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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
    if (!weeks?.length) {
      const html = renderTop3WinnersEmail([]);
      return NextResponse.json({
        week: maxPastWeek,
        year: pastWinnersYear,
        tools: [],
        html,
      });
    }

    const { products, week } = weeks[0];
    const tools = products.map(simpleToolApiDtoFormatter);
    const html = renderTop3WinnersEmail(
      products.slice(0, 3).map(p => ({
        slug: p.slug,
        name: p.name,
        description: p.description,
        logo_url: p.logo_url,
      })),
    );

    const { data } = await axios.post(
      'https://xuqkmyeuqfvucdo6gupjh7x6df8ohj6b.saasemailer.com/api/v1/devhunt.org/campaigns',
      {
        name: "🏆 Meet This Week's Top 3 Tools on DevHunt!",
        subject: "🏆 Meet This Week's Top 3 Tools on DevHunt!",
        audienceId: process.env.MARSX_MAILER_AUDIENCE_ID || '69f455ab8aee3505f37b2c29',
        content: html,
        topicName: 'DevHunt',
        sender: {
          name: 'DevHunt',
          emailFrom: 'hey@devhunt.org',
          from: 'hey@devhunt.org',
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

    return NextResponse.json({
      success: true,
    });
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
