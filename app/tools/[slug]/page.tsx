import { Metadata } from 'next';
import ToolsPageUI from '../components/ToolsPageUI';
import categories from '@/utils/categories';

export async function generateMetadata({ params: { slug } }: { params: { slug: string } }): Promise<Metadata> {
  const getOriginalSlug = () => {
    const getValidSlug = categories.filter(item => slug.replaceAll('-', ' ') == item.toLowerCase());
    return getValidSlug[0];
  };

  return {
    title: `Best ${getOriginalSlug()} Tools`,
    metadataBase: new URL('https://devhunt.org'),
    alternates: {
      canonical: `/tools/${slug}`,
    },
    openGraph: {
      title: `Best ${getOriginalSlug()} Tools`,
    },
    twitter: {
      title: `Best ${getOriginalSlug()} Tools`,
    },
  };
}

export default () => {
  return <ToolsPageUI />;
};
