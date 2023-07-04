import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { firstName, personalEMail } = await req.json();

  const WELCOME_EMAIL_API_KEY = process.env.WELCOME_EMAIL_API_KEY as string;
  const SIGNUP_FORM_ID = process.env.SIGNUP_FORM_ID as string;

  const apiURL = `https://cron.ventryweather.com/webhook-devhunt.php?apikey=${WELCOME_EMAIL_API_KEY}&name=${firstName}&tag=api&email=${personalEMail}&formid=${SIGNUP_FORM_ID}`;
  const res = await axios.get(apiURL);
  return NextResponse.json({ data: res.data });
}
