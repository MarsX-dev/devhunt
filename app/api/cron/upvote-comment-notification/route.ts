import CommentService from '@/utils/supabase/services/comments';
import { createServerClient } from '@/utils/supabase/server';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const commentService = new CommentService(createServerClient());

  const dayAgo = moment().add(-1, 'day').toDate();

  const groups = await commentService.getCommentsGroupedByProducts(dayAgo);
  console.log('yesterday comments', JSON.stringify(groups, null, 2));

  // call email sending here

  return NextResponse.json({ success: true });
}
