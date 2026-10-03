import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import ToolRow from '@/components/ui/ToolRow';
import InlineSponsor from '@/components/ui/Sponsors/InlineSponsor';
import { sponsorBefore } from '@/utils/ads';
import ListPagination from '@/components/ui/ListPagination';
import { getLeaderboardPage, LIST_PAGE_SIZE, pageFromParam } from '@/utils/toolLists';

const description = 'A launchpad for dev tools, built by developers for developers, open source, and fair.';
const ogImage = 'https://devhunt.org/api/og/home';

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
        {rows.map((tool, idx) => [
          sponsorBefore(idx, rows.length) >= 0 && <InlineSponsor key={`sponsor-${idx}`} n={sponsorBefore(idx, rows.length)} />,
          <ToolRow
            key={tool.id}
            tool={tool}
            rank={(page - 1) * LIST_PAGE_SIZE + idx + 1}
            rankDigits={String(page * LIST_PAGE_SIZE).length}
            showDate
            revealIndex={idx}
          />,
        ])}
      </ol>
      <ListPagination basePath="/all-dev-tools" page={page} totalPages={totalPages} />
      <div className="mb-16" />
    </section>
  );
}
