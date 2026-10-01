'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabase } from '@/components/supabase/provider';

// A blocked tool is a 404 for everyone (the page is cached and the same for all). The DevHunt team is
// sent on to the admin view, which shows it with an Unblock button (or back here if it doesn't exist).
export default function AdminToolRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useSupabase();
  const slug = pathname?.match(/^\/tool\/([^/]+)\/?$/)?.[1];

  useEffect(() => {
    if (!slug || !session?.user.id) return;
    // Once per tool per few minutes: a just-unblocked tool can 404 here for up to a minute while the
    // admin view already sends it back here.
    const key = `admin-tool-redirect:${slug}`;
    try {
      if (Date.now() - Number(sessionStorage.getItem(key) ?? 0) < 180000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {}
    fetch('/api/account/admin')
      .then(r => (r.ok ? r.json() : { admin: false }))
      .then(d => d.admin && router.replace(`/admin/tool/${slug}`))
      .catch(() => {});
  }, [slug, session?.user.id]);

  return null;
}
