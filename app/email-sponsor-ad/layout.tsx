import { notFound } from 'next/navigation';
import { type ReactNode } from 'react';
import { isLocalEmailAdEditorEnabled } from '@/utils/email-templates/email-sponsor-ad';

// Rendered per request: a prerendered notFound() is served with status 200 on Next 13.5.
export const dynamic = 'force-dynamic';

// The sponsor-ad editor only works in local development; hide the page everywhere else.
export default function EmailSponsorAdLayout({ children }: { children: ReactNode }) {
  if (!isLocalEmailAdEditorEnabled()) notFound();
  return <>{children}</>;
}
