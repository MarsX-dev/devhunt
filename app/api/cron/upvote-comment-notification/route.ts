import CommentService from '@/utils/supabase/services/comments';
import { createServerClient } from '@/utils/supabase/server';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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
  }[];
};

async function sendNotification(email: string, slug: string, product_name: string, commenter: string) {
  try {
    const response = await axios.post(
      `https://apinie.sensorpro.net/api/Campaign/TriggerEmail/${process.env.NOTIFICATION_API_KEY}`,
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
          comment: `you got a new comment on your product ${product_name} from ${commenter}`,
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
  const authHeader = request.headers.get('authorization');
  console.log(authHeader);

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const commentService = new CommentService(createServerClient());

  const dayAgo = moment().add(-1, 'day').toDate();

  const groups = await commentService.getCommentsGroupedByProducts(dayAgo);

  const sentEmails = new Set();
  groups.forEach(item => {
    const commentItem = item as Icomment;
    const email = commentItem.product.profiles.email;
    const userProfile = commentItem.comments[0].profiles;
    if (!sentEmails.has(email) && commentItem.product.profiles.id != userProfile.id) {
      const { name, slug } = item.product;
      sendNotification(email, slug as string, name as string, userProfile.full_name);
      sentEmails.add(email);
    }
  });

  return NextResponse.json({ success: true });
}
