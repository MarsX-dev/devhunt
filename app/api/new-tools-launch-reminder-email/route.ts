import ApiService from '@/utils/supabase/services/api';
import { simpleToolApiDtoFormatter } from '@/pages/api/api-formatters';
import { renderNewToolsLaunchReminderEmail } from '@/utils/email-templates/render-new-tools-launch-reminder-email';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

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

    await axios.post(
      'https://xuqkmyeuqfvucdo6gupjh7x6df8ohj6b.saasemailer.com/api/v1/rapidforms.co/campaigns/69f280ce4cd9d4f3345d56e3/schedule/',
      {
        name: '🏆 Who Will Be Tool of The Week?',
        subject: '🏆 Who Will Be Tool of The Week?',
        audienceId: '69f2807c4cd9d4f3345d56e2',
        content: html,
        topicName: 'DevHunt',
        sender: {
          name: 'DevHunt',
          from: 'sididev3@gmail.com',
          replyTo: 'hey@devhunt.org',
        },
      },
      {
        headers: {
          Cookie: 'saasemailer_user_usermodel_token=apt_eRsB6mXy5ROVmtpLflC-KFdUDPdGUonTBczuSVjKkAE',
        },
      },
    );

    //   return NextResponse.json({
    //     week,
    //     year,
    //     tools,
    //     html,
    //   });
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ data: 'error' }, { status: 500 });
  }
}
