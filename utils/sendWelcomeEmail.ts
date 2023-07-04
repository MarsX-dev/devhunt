import axios from 'axios';

export default async ({ firstName, personalEMail }: { firstName: string; personalEMail: string }) => {
  const WELCOME_EMAIL_API_KEY = process.env.WELCOME_EMAIL_API_KEY as string;
  const SIGNUP_FORM_ID = process.env.SIGNUP_FORM_ID as string;

  const apiURL = `https://cron.ventryweather.com/webhook-devhunt.php?apikey=${WELCOME_EMAIL_API_KEY}&name=${firstName}&tag=api&email=${personalEMail}&formid=${SIGNUP_FORM_ID}`;
  return await axios.get(apiURL);
};
