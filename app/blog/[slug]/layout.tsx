import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getArticle } from '@/utils/blog';

// Runs before the loading skeleton streams, so unknown posts return a real 404 (cached, so cheap).
export default async function ArticleLayout({ children, params: { slug } }: { children: ReactNode; params: { slug: string } }) {
  if (!(await getArticle(slug))) notFound();
  return <>{children}</>;
}
