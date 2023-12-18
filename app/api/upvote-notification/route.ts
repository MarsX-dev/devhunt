import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import ProductsService from '@/utils/supabase/services/products';
import { upvoteLogsService } from '@/utils/supabase/services/upvoteCommenLogs';
import { createBrowserClient } from '@/utils/supabase/browser';

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

async function sendNotification(email: string, slug: string, product_name: string, commenter: string, token: string) {
  try {
    const response = await axios.post(
      `https://apinie.sensorpro.net/api/Campaign/TriggerEmail/${token}`,
      {
        CampId: 'eaa0d0ff-6367-46c7-a464-94abd837ac31',
        BroadcastId: 2,
        Delay: 0,
        ContactData: {
          PersonalEMail: email,
        },
        NamedPairsParameters: {
          toolname: product_name,
          link: `devhunt.org/tool/${slug}`,
          author: commenter,
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

  const productsService = new ProductsService(createBrowserClient());
  const initUpvoteLogsService = await upvoteLogsService();

  const dayAgo = moment().add(-2, 'day').toDate();

  const groups = await productsService.getUpvotesGroupedByProducts(dayAgo);

  if ((await initUpvoteLogsService.getTodayLog()).length == 0) {
    const sentEmails = new Set();
    groups.forEach(item => {
      const voteItem = item as IVote;
      const email = voteItem.product.profiles.email;
      const userProfile = voteItem.voter_data;
      if (!sentEmails.has(email) && voteItem.product.profiles.id != userProfile.id) {
        const { name, slug } = item.product;

        sendNotification(email, slug as string, name as string, userProfile.full_name, getToken);
        sentEmails.add(email);
      }
    });

    await initUpvoteLogsService.insertUpvoteLogs({ upvotes_number: groups.length, emails_sent: sentEmails.size });
  }

  return NextResponse.json({ success: true });
}
