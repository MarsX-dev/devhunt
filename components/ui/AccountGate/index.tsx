'use client';

import { type ReactNode } from 'react';
import { useSupabase } from '@/components/supabase/provider';
import LoginPage from '@/components/ui/LoginPage';

// Account pages need a signed-in user; others see the login page.
export default function AccountGate({ children }: { children: ReactNode }) {
  const { session } = useSupabase();
  return session?.user ? <>{children}</> : <LoginPage />;
}
