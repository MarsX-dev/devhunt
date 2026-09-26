import { notFound } from 'next/navigation';
import { type ReactNode } from 'react';
import { isLocalEmailAdEditorEnabled } from '@/utils/email-templates/email-sponsor-ad';

// The sponsor-ad editor only works in local development; hide the page everywhere else.
export default function EmailSponsorAdLayout({ children }: { children: ReactNode }) {
  if (!isLocalEmailAdEditorEnabled()) notFound();
  return <>{children}</>;
}
