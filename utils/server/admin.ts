import { createServerClient } from '@/utils/supabase/server';

// DevHunt team accounts (ADMIN_EMAILS, comma-separated) can see internal pages under /admin.
const ADMIN_EMAILS = () =>
  (process.env.ADMIN_EMAILS ?? 'john@marsx.dev,johnrush@filmgrail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

// Sign-ins that prove the person owns the email (Google and GitHub only hand out verified addresses).
const TRUSTED_PROVIDERS = ['github', 'google'];

// getUser() verifies the session with Supabase Auth (a cookie alone isn't trusted). The admin email
// must also come from a Google/GitHub identity: an email/password sign-up with an admin's address,
// if that sign-in method were ever enabled, doesn't count.
export async function isAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await createServerClient().auth.getUser();
  const admins = ADMIN_EMAILS();
  return !!user?.identities?.some(
    identity =>
      TRUSTED_PROVIDERS.includes(identity.provider) &&
      admins.includes(String(identity.identity_data?.email ?? '').toLowerCase()) &&
      identity.identity_data?.email_verified !== false,
  );
}
