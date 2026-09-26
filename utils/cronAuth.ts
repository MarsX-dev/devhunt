import { timingSafeEqual } from 'node:crypto';

// Cron/mailer endpoints must be called with `Authorization: Bearer <MARSX_MAILER_AUTH>`.
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.MARSX_MAILER_AUTH;

  if (process.env.NODE_ENV === 'development') return true;

  if (!secret) return false;

  const auth = req.headers.get('authorization');
  const expected = `Bearer ${secret}`;
  if (!auth || auth.length !== expected.length) return false;

  try {
    const enc = new TextEncoder();
    return timingSafeEqual(enc.encode(auth), enc.encode(expected));
  } catch {
    return false;
  }
}
