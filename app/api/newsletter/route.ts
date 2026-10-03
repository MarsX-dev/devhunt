import { NextResponse } from 'next/server';
import { clientIp, tooManyRequests, withinLimit } from '@/utils/server/rateLimit';

const SAASEMAILER_CONTACTS_CREATE = 'https://xuqkmyeuqfvucdo6gupjh7x6df8ohj6b.saasemailer.com/api/v1/devhunt.org/contacts/create/';

export async function POST(req: Request) {
  if (!(await withinLimit(`newsletter:ip:${clientIp(req)}`, 5, 3600))) return tooManyRequests();
  try {
    const body = await req.json().catch(() => null);
    const personalEMail = typeof body?.personalEMail === 'string' ? body.personalEMail.trim() : '';

    if (!personalEMail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEMail)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const source = typeof body?.source === 'string' && /^[a-z_]{1,30}$/.test(body.source) ? body.source : 'newsletter';

    const auth = process.env.MARSX_MAILER_AUTH;
    const audienceId = process.env.MARSX_MAILER_AUDIENCE_ID || '69f455ab8aee3505f37b2c29';

    if (!auth || !audienceId) {
      console.error('newsletter: MARSX_MAILER_AUTH or newsletter audience id is not set');
      return NextResponse.json({ error: 'Newsletter is not configured' }, { status: 500 });
    }

    const res = await fetch(SAASEMAILER_CONTACTS_CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mars-authorization': auth,
      },
      body: JSON.stringify({
        email: personalEMail,
        customData: {
          signup_source: source,
        },
        audienceId,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('newsletter: SaasMailer error', res.status, data);
      return NextResponse.json(
        { error: 'Subscription failed', data },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
