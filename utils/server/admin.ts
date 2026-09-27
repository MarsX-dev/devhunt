import { createServerClient } from '@/utils/supabase/server';

// DevHunt team accounts (ADMIN_EMAILS, comma-separated) can see internal pages like /account/analytics.
const ADMIN_EMAILS = () =>
  (process.env.ADMIN_EMAILS ?? 'john@marsx.dev,johnrush@filmgrail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

export async function isAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await createServerClient().auth.getUser();
  return !!user?.email && ADMIN_EMAILS().includes(user.email.toLowerCase());
}
