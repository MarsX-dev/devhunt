import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import categories from '@/utils/categories';
import PageHeader from '@/components/ui/PageHeader';
import ToolRow from '@/components/ui/ToolRow';
import ListPagination from '@/components/ui/ListPagination';
import MonitizorAdCards from '@/components/ui/MonitizerAdCards';
import { createBrowserClient } from '@/utils/supabase/browser';
import CategoryService from '@/utils/supabase/services/categories';
import { getLeaderboardPage, LIST_PAGE_SIZE, pageFromParam } from '@/utils/toolLists';

type Params = { params: { slug: string }; searchParams: { page?: string } };

const getOriginalSlug = (slug: string) => categories.find(item => slug.replaceAll('-', ' ') == item.name.toLowerCase())?.name;
const categoryDescription = (name?: string) => categories.find(c => c.name === name)?.description ?? '';

export async function generateMetadata({ params: { slug }, searchParams }: Params): Promise<Metadata> {
  const name = getOriginalSlug(slug);
  if (!name) return { title: '404: This page could not be found.', description: '' };
  const page = pageFromParam(searchParams?.page);
  const title = `Best ${name} Tools${page > 1 ? ` - Page ${page}` : ''} | DevHunt`;
  const description = `${categoryDescription(name)} The best ${name} dev tools launched on DevHunt, ranked by developer upvotes.`;
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: { canonical: page > 1 ? `/tools/${slug}?page=${page}` : `/tools/${slug}` },
    openGraph: { title, description, images: ['https://devhunt.org/devhuntog.png?v=2'], url: `https://devhunt.org/tools/${slug}` },
    twitter: { card: 'summary_large_image', title, description, images: ['https://devhunt.org/devhuntog.png?v=2'] },
  };
}

export default async function CategoryPage({ params: { slug }, searchParams }: Params) {
  const categoryName = getOriginalSlug(slug);
  if (!categoryName) notFound();

  const found = (await new CategoryService(createBrowserClient()).search(categoryName)) as { id: number; name: string }[] | null;
  const category = found?.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  if (!category) notFound();

  const page = pageFromParam(searchParams?.page);
  const { rows, total } = await getLeaderboardPage(page, category.id);
  const totalPages = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));
  if (page > totalPages) notFound();

  return (
    <section className="max-w-4xl mt-10 mx-auto px-4 md:px-8">
      <PageHeader eyebrow="Category" title={`Best ${categoryName} tools`}>
        {categoryDescription(categoryName)} {total.toLocaleString('en-US')} tools, ranked by upvotes from the community.
      </PageHeader>
      <MonitizorAdCards />
      <ol className="mt-10 mb-4">
        {rows.map((tool, idx) => (
          <ToolRow
            key={tool.id}
            tool={tool}
            rank={(page - 1) * LIST_PAGE_SIZE + idx + 1}
            rankDigits={String(page * LIST_PAGE_SIZE).length}
            showDate
            revealIndex={idx}
          />
        ))}
      </ol>
      <ListPagination basePath={`/tools/${slug}`} page={page} totalPages={totalPages} />
      <div className="mb-16" />
    </section>
  );
}
