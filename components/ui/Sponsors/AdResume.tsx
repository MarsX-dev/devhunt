'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabase } from '@/components/supabase/provider';
import type { AdKind } from '@/utils/ads';

// The ad builder saves its choices before sending a visitor to sign in. If OAuth brings them back
// to the home page instead of /advertise, send them on so the builder can pick up where they were.
export const PENDING_KEY = 'dh_ad_builder';
export type PendingAd = { url: string; kinds: AdKind[]; monthly?: AdKind[]; at: number }; // monthly: kinds bought monthly, the rest weekly

export default function AdResume() {
  const path = usePathname();
  const router = useRouter();
  const { session } = useSupabase();
  useEffect(() => {
    if (path !== '/' || !session?.user) return;
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null') as PendingAd | null;
      if (pending && Date.now() - pending.at < 30 * 60_000) router.replace('/advertise');
    } catch {}
  }, [path, session, router]);
  return null;
}
