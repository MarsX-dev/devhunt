import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { personalEMail } = await req.json();

  const NEWSLETTER_FORM_ID = process.env.NEWSLETTER_FORM_ID as string;
  const WELCOME_EMAIL_API_KEY = process.env.WELCOME_EMAIL_API_KEY as string;

  const apiURL = `https://cron.ventryweather.com/webhook-devhunt.php?apikey=${WELCOME_EMAIL_API_KEY}&tag=newsletter&email=${personalEMail}&formid=${NEWSLETTER_FORM_ID}`;
  const res = await axios.get(apiURL);
  return NextResponse.json({ data: res.data });
}
