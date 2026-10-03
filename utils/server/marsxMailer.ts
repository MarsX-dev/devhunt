import axios from 'axios';

const MAILER = 'https://xuqkmyeuqfvucdo6gupjh7x6df8ohj6b.saasemailer.com/api/v1/devhunt.org/campaigns';

// Creates a newsletter campaign for the DevHunt audience and schedules it right away.
export async function sendMarsxCampaign(subject: string, html: string) {
  const headers = { 'mars-authorization': process.env.MARSX_MAILER_AUTH };
  const { data } = await axios.post(
    MAILER,
    {
      name: subject,
      subject,
      audienceId: process.env.MARSX_MAILER_AUDIENCE_ID || '69f455ab8aee3505f37b2c29',
      content: html,
      topicName: 'DevHunt',
      sender: {
        name: 'DevHunt',
        domainFrom: 'hey',
        emailFrom: 'hey@devhunt.org',
        from: 'hey@devhunt.org',
        replyTo: 'hey@devhunt.org',
      },
    },
    { headers },
  );
  await axios.post(`${MAILER}/${data._id}/schedule`, {}, { headers });
}
