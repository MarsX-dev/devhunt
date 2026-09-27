import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { categoryExists } from '@/utils/routeExists';

// Runs before the loading skeleton streams, so unknown categories return a real 404.
export default function CategoryLayout({ children, params: { slug } }: { children: ReactNode; params: { slug: string } }) {
  if (!categoryExists(slug)) notFound();
  return <>{children}</>;
}
