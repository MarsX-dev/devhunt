import CommentService from '@/utils/supabase/services/comments';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/app/api/new-tools-launch-reminder-email/route';
import { commentLogsService } from '@/utils/supabase/services/upvoteCommenLogs';
import { createBrowserClient } from '@/utils/supabase/browser';
import commentNotificationEmailTemplate from '@/utils/email-templates/comment-notification-email-template';
import { Resend } from 'resend';

type Icomment = {
  product: {
    name: string;
    slug: string;
    profiles: {
      email: string;
      id: string;
    };
  };
  comments: {
    profiles: {
      id: string;
      full_name: string;
    };
    content: string;
  }[];
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncateComment(text: string, max = 320): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatCommentForEmail(text: string): string {
  return escapeHtml(truncateComment(text)).replace(/\r\n|\r|\n/g, '<br />');
}

function buildCommentEmailHtml(params: {
  productName: string;
  commenterName: string;
  commentPreview: string;
  toolUrl: string;
}): string {
  const preheader = `${params.commenterName} commented on ${params.productName} — jump in on DevHunt.`;
  return commentNotificationEmailTemplate
    .replace(/\{\{preheader\}\}/g, escapeHtml(preheader))
    .replace(/\{\{productName\}\}/g, escapeHtml(params.productName))
    .replace(/\{\{commenterName\}\}/g, escapeHtml(params.commenterName))
    .replace(/\{\{commentPreview\}\}/g, params.commentPreview)
    .replace(/\{\{toolUrl\}\}/g, params.toolUrl)
    .replace(/\{\{unsubscribeUrl\}\}/g, 'https://devhunt.org/newsletter/unsubscribe');
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) return new NextResponse('Unauthorized', { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('comment-notification: RESEND_API_KEY is not set');
    return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  console.log('Comments notification Works');

  const commentService = new CommentService(createBrowserClient());
  const initCommentLogsService = await commentLogsService();

  const dayAgo = moment().add(-2, 'day').toDate();

  const groups = await commentService.getCommentsGroupedByProducts(dayAgo);

  if ((await initCommentLogsService.getTodayLog()).length == 0) {
    const sentEmails = new Set<string>();
    const sendTasks: Promise<unknown>[] = [];

    for (const item of groups) {
      const commentItem = item as Icomment;
      const email = commentItem.product.profiles.email;
      const userProfile = commentItem.comments[0].profiles;
      if (!sentEmails.has(email) && commentItem.product.profiles.id != userProfile.id) {
        const { name, slug } = item.product;
        const toolUrl = `https://devhunt.org/tool/${slug}#comments`;
        const html = buildCommentEmailHtml({
          productName: name as string,
          commenterName: userProfile.full_name || 'Someone',
          commentPreview: formatCommentForEmail(commentItem.comments[0].content),
          toolUrl,
        });
        const to =
          process.env.NODE_ENV === 'development'
            ? ['sididev3@gmail.com', 'nazar@marsx.dev']
            : email;

        sendTasks.push(
          resend.emails.send({
            from: 'DevHunt <hey@devhunt.org>',
            to,
            subject: `New comment on ${name} · DevHunt`,
            replyTo: 'hey@devhunt.org',
            html,
          }),
        );
        sentEmails.add(email);
      }
    }

    await Promise.all(sendTasks);

    await initCommentLogsService.insertCommentLogs({ comments_number: groups.length, emails_sent: sentEmails.size });
  }

  return NextResponse.json({ success: true });
}
