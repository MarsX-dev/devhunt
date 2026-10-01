import { getToolPageData } from '@/utils/toolPageData';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import ToolPageView, { metaDescription } from './ToolPageView';
import { toolTitle } from '@/utils/seoIndex';

// Cached after the first visit (CDN); nothing is built ahead. Next 14 caches a not-found page with its
// 404 status (13.5 cached it as 200, so this page used to render on every request).
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

// set dynamic metadata
export async function generateMetadata({ params: { slug } }: { params: { slug: string } }): Promise<Metadata> {
  const tool = (await getToolPageData(slug))?.product;
  if (!tool) return { title: 'Page not found - Dev Hunt' };

  const description = metaDescription(tool.slogan, tool.description);
  // Branded card with the first screenshot (app/api/og/tool).
  const shareImage = { url: `https://devhunt.org/api/og/tool/${encodeURIComponent(slug)}`, width: 1200, height: 630, alt: `${tool.name} on DevHunt` };
  const title = toolTitle(slug, tool.name, tool.slogan);
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: {
      canonical: `/tool/${slug}`,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      images: [shareImage],
      url: `https://devhunt.org/tool/${slug}`,
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      images: [shareImage],
    },
  };
}

export default async function Page({ params: { slug } }: { params: { slug: string } }): Promise<JSX.Element> {
  // Hidden tools (website dead or hijacked) are a 404 (the owner sees why in their dashboard): the page
  // is the same for everyone, so it can't depend on who is signed in. Admins are sent from the 404 to
  // /admin/tool/[slug] for blocked tools.
  const data = await getToolPageData(slug);
  if (!data) notFound();
  return <ToolPageView data={data} slug={slug} />;
}
