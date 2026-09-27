import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import ToolRow from '@/components/ui/ToolRow';
import ListPagination from '@/components/ui/ListPagination';
import { getLeaderboardPage, LIST_PAGE_SIZE, pageFromParam } from '@/utils/toolLists';

const description = 'A launchpad for dev tools, built by developers for developers, open source, and fair.';
const ogImage = 'https://devhunt.org/devhuntog.png?v=2';

export async function generateMetadata({ searchParams }: { searchParams: { page?: string } }): Promise<Metadata> {
  const page = pageFromParam(searchParams?.page);
  const title = `Explore the best Dev Tools on Dev Hunt${page > 1 ? ` - Page ${page}` : ''}`;
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: { canonical: page > 1 ? `/all-dev-tools?page=${page}` : '/all-dev-tools' },
    openGraph: { title, description, images: [ogImage], url: 'https://devhunt.org/all-dev-tools' },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function Page({ searchParams }: { searchParams: { page?: string } }) {
  const page = pageFromParam(searchParams?.page);
  const { rows, total } = await getLeaderboardPage(page);
  const totalPages = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));
  if (page > totalPages) notFound();

  return (
    <section className="max-w-4xl mt-10 mx-auto px-4 md:px-8">
      <PageHeader eyebrow="All-time leaderboard" title="All dev tools on DevHunt">
        {total.toLocaleString('en-US')} tools, ranked by upvotes from the community.
      </PageHeader>
      <ol className="mt-10 mb-4">
        {rows.map((tool, idx) => (
          <ToolRow key={tool.id} tool={tool} rank={(page - 1) * LIST_PAGE_SIZE + idx + 1} showDate revealIndex={idx} />
        ))}
      </ol>
      <ListPagination basePath="/all-dev-tools" page={page} totalPages={totalPages} />
      <div className="mb-16" />
    </section>
  );
}
