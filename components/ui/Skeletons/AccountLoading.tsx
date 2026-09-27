'use client';

import { usePathname } from 'next/navigation';
import { AccountSkeleton } from './PageSkeletons';

// Account routes share one loading.tsx; this picks the skeleton shaped like the page being opened.
export default function AccountLoading() {
  return <AccountSkeleton pathname={usePathname() ?? ''} />;
}
