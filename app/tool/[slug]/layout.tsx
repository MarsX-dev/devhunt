import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { toolExists } from '@/utils/routeExists';

// Runs before the loading skeleton streams, so unknown or deleted tools return a real 404.
export default async function ToolLayout({ children, params: { slug } }: { children: ReactNode; params: { slug: string } }) {
  if (!(await toolExists(decodeURIComponent(slug)))) notFound();
  return children;
}
