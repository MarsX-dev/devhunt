import axios from 'axios';
import { Webhook } from 'standardwebhooks';
import { NextResponse } from 'next/server';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Verify the webhook signature
    const wh = new Webhook(WEBHOOK_SECRET);
    const payload = wh.verify(body, headers);

    const {
      user: { user_metadata },
    }: any = payload;

    const { email, full_name } = user_metadata;

    await fetch('https://xuqkmyeuqfvucdo6gupjh7x6df8ohj6b.saasemailer.com/api/v1/devhunt.org/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mars-authorization': process.env.MARSX_MAILER_AUTH!,
      },
      body: JSON.stringify({
        email,
        customData: {
          full_name,
        },
        audienceId: process.env.MARSX_MAILER_AUDIENCE_ID || '69f455ab8aee3505f37b2c29',
      }),
    });

    await fetch('https://xuqkmyeuqfvucdo6gupjh7x6df8ohj6b.saasemailer.com/api/v1/devhunt.org/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mars-authorization': process.env.MARSX_MAILER_AUTH!,
      },
      body: JSON.stringify({
        email,
        customData: {
          full_name,
        },
        audienceId: process.env.MARSX_MAILER_AUDIENCE_ID || '69f0c65c4cd9d4f3345d4485',
      }),
    });

    return NextResponse.json({ data: 'success' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ data: 'error' }, { status: 500 });
  }
}
