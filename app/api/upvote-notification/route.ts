import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/app/api/new-tools-launch-reminder-email/route';
import ProductsService from '@/utils/supabase/services/products';
import { upvoteLogsService } from '@/utils/supabase/services/upvoteCommenLogs';
import { createBrowserClient } from '@/utils/supabase/browser';
import upvoteNotificationEmailTemplate from '@/utils/email-templates/upvote-notification-email-template';
import { Resend } from 'resend';

type IVote = {
  product: {
    name: string;
    slug: string;
    profiles: {
      id: string;
      email: string;
    };
  };
  voter_data: {
    full_name: string;
    id: string;
  };
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildUpvoteEmailHtml(params: { productName: string; voterName: string; toolUrl: string }): string {
  const preheader = `${params.voterName} upvoted ${params.productName} on DevHunt.`;
  return upvoteNotificationEmailTemplate
    .replace(/\{\{preheader\}\}/g, escapeHtml(preheader))
    .replace(/\{\{productName\}\}/g, escapeHtml(params.productName))
    .replace(/\{\{voterName\}\}/g, escapeHtml(params.voterName))
    .replace(/\{\{toolUrl\}\}/g, params.toolUrl)
    .replace(/\{\{unsubscribeUrl\}\}/g, 'https://devhunt.org/newsletter/unsubscribe');
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) return new NextResponse('Unauthorized', { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('upvote-notification: RESEND_API_KEY is not set');
    return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  console.log('Upvote notification Works');

  const productsService = new ProductsService(createBrowserClient());
  const initUpvoteLogsService = await upvoteLogsService();

  const dayAgo = moment().add(-2, 'day').toDate();

  const groups = await productsService.getUpvotesGroupedByProducts(dayAgo);

  if ((await initUpvoteLogsService.getTodayLog()).length == 0) {
    const sentEmails = new Set<string>();
    const sendTasks: Promise<unknown>[] = [];

    for (const item of groups) {
      const voteItem = item as IVote;
      const email = voteItem.product.profiles.email;
      const userProfile = voteItem.voter_data;
      if (!sentEmails.has(email) && voteItem.product.profiles.id != userProfile.id) {
        const { name, slug } = item.product;
        const toolUrl = `https://devhunt.org/tool/${slug}`;
        const html = buildUpvoteEmailHtml({
          productName: name as string,
          voterName: userProfile.full_name || 'Someone',
          toolUrl,
        });
        const to =
          process.env.NODE_ENV === 'development' ? ['sididev3@gmail.com', 'nazar@marsx.dev'] : email;

        sendTasks.push(
          resend.emails.send({
            from: 'DevHunt <hey@devhunt.org>',
            to,
            subject: `New upvote on ${name} · DevHunt`,
            replyTo: 'hey@devhunt.org',
            html,
          }),
        );
        sentEmails.add(email);
      }
    }

    await Promise.all(sendTasks);

    await initUpvoteLogsService.insertUpvoteLogs({ upvotes_number: groups.length, emails_sent: sentEmails.size });
  }

  return NextResponse.json({ success: true });
}
