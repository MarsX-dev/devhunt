'use client';

import { type ReactNode } from 'react';
import { useSupabase } from '@/components/supabase/provider';
import LoginPage from '../../components/ui/LoginPage';

export default ({ children }: { children: ReactNode }) => {
  const { session } = useSupabase();
  const user = session?.user;
  return user ? <div className="mt-10 mb-32">{children}</div> : <LoginPage />;
};
