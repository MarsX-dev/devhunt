import { timingSafeEqual } from 'node:crypto';

// Cron/mailer endpoints must be called with `Authorization: Bearer <secret>`: MARSX_MAILER_AUTH
// (external mailer) or CRON_SECRET (Vercel Cron sends it automatically).
export function isAuthorizedCron(req: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const auth = req.headers.get('authorization');
  if (!auth) return false;
  return [process.env.MARSX_MAILER_AUTH, process.env.CRON_SECRET].some(secret => {
    if (!secret) return false;
    const expected = `Bearer ${secret}`;
    if (auth.length !== expected.length) return false;
    try {
      const enc = new TextEncoder();
      return timingSafeEqual(enc.encode(auth), enc.encode(expected));
    } catch {
      return false;
    }
  });
}
