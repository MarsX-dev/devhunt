import axios from 'axios';

export default async ({ FirstName, PersonalEMail }: { FirstName: string; PersonalEMail: string }) => {
  const WELCOME_EMAIL_WEBHOOK = process.env.WELCOME_EMAIL_WEBHOOK as string;
  const SIGNUP_FORM_ID = process.env.SIGNUP_FORM_ID as string;
  const data = {
    AddToList: ['api'],
    Contact: [
      {
        FirstName,
        LastName: '',
        PersonalEMail,
      },
    ],
    Options: {
      Parameters: [],
      Action: '',
    },
    ReturnFailedRequests: false,
    UpdateByKey: 'email',
    SendWelcomeEmail: true,
    SignupFormId: SIGNUP_FORM_ID,
  };
  return await axios.post(WELCOME_EMAIL_WEBHOOK, data);
};
