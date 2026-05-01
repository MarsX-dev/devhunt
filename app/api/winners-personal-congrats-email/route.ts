import ApiService from '@/utils/supabase/services/api';
import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/app/api/new-tools-launch-reminder-email/route';
import winnersPersonalCongratsEmailTemplate from '@/utils/email-templates/winners-personal-congrats-email-template';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
      return NextResponse.json({
        week: currentWeek,
        year,
        tools: [],
        html: '',
      });
    }

    const { products, week } = weeks[0];

    const ranks = ['1st', '2nd', '3rd'];

    const emailData = products.slice(0, 3).map((p: any, idx) => {
      const emailToName = p.email.split('@')[0];
      const rank = ranks[idx];
      const html = winnersPersonalCongratsEmailTemplate.replace('{{namehere}}', emailToName || '').replace('{{rankhere}}', rank || '');
      return { html, email: p.email, rank };
    });

    emailData.forEach(async ({ html, email, rank }: { html: string; email: string; rank: string }) => {
      const toEmails = process.env.NODE_ENV == 'development' ? ['sididev3@gmail.com', 'nazar@marsx.dev'] : email;
      await resend.emails.send({
        from: 'DevHunt <hey@devhunt.org>',
        to: toEmails,
        subject: `Celebrating your ${rank} remarkable place win on DevHunt 🎉`,
        replyTo: 'hey@devhunt.org',
        html,
      });
    });

    return NextResponse.json({
      success: true,
    });
    // return new NextResponse(htmlTemplates[0], {
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
