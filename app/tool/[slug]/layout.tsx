import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ownHiddenTool, toolExists } from '@/utils/routeExists';

// Runs before the loading skeleton streams, so unknown, deleted or hidden tools return a real 404.
export default async function ToolLayout({ children, params: { slug } }: { children: ReactNode; params: { slug: string } }) {
  const name = decodeURIComponent(slug);
  // Hidden tools (dead or hijacked website) are a 404 for everyone except their owner.
  if (!(await toolExists(name)) && !(await ownHiddenTool(name))) notFound();
  return <>{children}</>;
}
