import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { resolve } from './resolve';

// Runs before the loading skeleton streams, so unknown pairs are a real 404 and a reversed pair a
// real redirect (getComparison is cached, so the page's own lookup is free).
export default async function CompareLayout({ children, params: { pair } }: { children: ReactNode; params: { pair: string } }) {
  if (!(await resolve(pair))) notFound();
  return <>{children}</>;
}
