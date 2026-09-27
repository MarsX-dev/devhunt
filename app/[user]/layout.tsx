import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { profileExists } from '@/utils/routeExists';

// Profiles live at /@username; this catch-all also receives every unknown top-level path. The check
// runs before the loading skeleton streams, so those get a real 404.
export default async function ProfileLayout({ children, params: { user } }: { children: ReactNode; params: { user: string } }) {
  const decoded = decodeURIComponent(user);
  if (!decoded.startsWith('@') || !(await profileExists(decoded.slice(1)))) notFound();
  return children;
}
