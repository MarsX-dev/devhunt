import CommentService from '@/utils/supabase/services/comments';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { commentLogsService } from '@/utils/supabase/services/upvoteCommenLogs';
import { createBrowserClient } from '@/utils/supabase/browser';

type Icomment = {
  product: {
    // Owner Data
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

// Get the token that will be passed to the email api as a token.
async function getAuthToken() {
  let data = JSON.stringify({
    Organization: 'devhunt',
    User: 'apiuser',
    Password: process.env.AUTH_TOKEN_PASSWORD,
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://apinie.sensorpro.net/auth/sys/signin',
    headers: {
      'Content-Type': 'application/json',
      'x-apikey': process.env.AUTH_TOKEN_API_KEY,
    },
    data: data,
  };

  return await axios.request(config);
}

async function sendNotification(email: string, slug: string, product_name: string, commenter: string, comment: string, token: string) {
  try {
    const response = await axios.post(
      `https://apinie.sensorpro.net/api/Campaign/TriggerEmail/${token}`,
      {
        CampId: 'eaa0d0ff-6367-46c7-a464-94abd837ac31',
        BroadcastId: 1,
        Delay: 0,
        ContactData: {
          PersonalEMail: email,
        },
        NamedPairsParameters: {
          toolname: product_name,
          link: `devhunt.org/tool/${slug}#comments`,
          author: commenter,
          comment,
          commentlink: `devhunt.org/tool/${slug}#comments`,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    // console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error);
  }
}

export async function GET(request: NextRequest) {
  const getToken = (await getAuthToken()).data.Token;

  const commentService = new CommentService(createBrowserClient());
  const initCommentLogsService = await commentLogsService();

  const dayAgo = moment().add(-2, 'day').toDate();

  const groups = await commentService.getCommentsGroupedByProducts(dayAgo);

  if ((await initCommentLogsService.getTodayLog()).length == 0) {
    const sentEmails = new Set();
    groups.forEach(item => {
      const commentItem = item as Icomment;
      const email = commentItem.product.profiles.email;
      const userProfile = commentItem.comments[0].profiles;
      if (!sentEmails.has(email) && commentItem.product.profiles.id != userProfile.id) {
        const { name, slug } = item.product;

        sendNotification(email, slug as string, name as string, userProfile.full_name, commentItem.comments[0].content, getToken);
        sentEmails.add(email);
      }
    });

    await initCommentLogsService.insertCommentLogs({ comments_number: groups.length, emails_sent: sentEmails.size });
  }

  return NextResponse.json({ success: true });
}
