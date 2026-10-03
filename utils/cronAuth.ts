import { timingSafeEqual } from 'node:crypto';

// Cron/mailer endpoints must be called with `Authorization: Bearer <secret>`: CRON_SECRET is what Vercel
// Cron sends (vercel.json), MARSX_MAILER_AUTH is kept for manual calls. Also in local development (set
// CRON_SECRET in .env.local): `next dev` listens on the network and these routes send real email.
export function isAuthorizedCron(req: Request): boolean {

  const auth = req.headers.get('authorization');
  if (!auth) return false;
  const enc = new TextEncoder();
  return [process.env.CRON_SECRET, process.env.MARSX_MAILER_AUTH].some(secret => {
    if (!secret) return false;
    const expected = `Bearer ${secret}`;
    return auth.length === expected.length && timingSafeEqual(enc.encode(auth), enc.encode(expected));
  });
}
