'use client';

import { type ReactNode } from 'react';
import { useSupabase } from '@/components/supabase/provider';
import LoginPage from '@/components/ui/LoginPage';
import AccountLoading from '@/components/ui/Skeletons/AccountLoading';

// Account pages need a signed-in user; others see the login page. The session loads in the browser,
// so wait for it (and the profile) instead of flashing the login page.
export default function AccountGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSupabase();
  if (loading) return <AccountLoading />;
  return session?.user ? <>{children}</> : <LoginPage />;
}
