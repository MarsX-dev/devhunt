import { type ReactNode } from 'react';
import { type Metadata } from 'next';
import AccountGate from '@/components/ui/AccountGate';

// Private pages: keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountGate>{children}</AccountGate>;
}
