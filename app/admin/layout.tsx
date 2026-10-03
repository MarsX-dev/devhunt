import { type ReactNode } from 'react';
import { type Metadata } from 'next';

// DevHunt team pages. Each page checks isAdmin() on the server and 404s for everyone else.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
