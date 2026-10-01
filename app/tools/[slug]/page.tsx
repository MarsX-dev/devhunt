import InlineSponsor from '@/components/ui/Sponsors/InlineSponsor';
import { sponsorBefore } from '@/utils/ads';
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
import { getCategoryHubStats } from '@/utils/categoryHub';
import { CategoryHubFaq, CategoryHubIntro, CategoryWellKnown, categoryFaq, categoryJsonLd } from '@/components/ui/CategoryHub';

type Params = { params: { slug: string }; searchParams: { page?: string } };

const getOriginalSlug = (slug: string) => categories.find(item => slug.replaceAll('-', ' ') == item.name.toLowerCase())?.name;
const categoryDescription = (name?: string) => categories.find(c => c.name === name)?.description ?? '';

export async function generateMetadata({ params: { slug }, searchParams }: Params): Promise<Metadata> {
  const name = getOriginalSlug(slug);
  if (!name) return { title: '404: This page could not be found.', description: '' };
  const page = pageFromParam(searchParams?.page);
  // Page 1 carries the year (the ranking and its facts update with every launch); later pages are plain lists.
  const title = page > 1 ? `Best ${name} Tools - Page ${page} | DevHunt` : `Best ${name} Tools in ${new Date().getUTCFullYear()} | DevHunt`;
  const shareImage = { url: `https://devhunt.org/api/og/category/${slug}`, width: 1200, height: 630, alt: title };
  const description = `${categoryDescription(name)} The best ${name} dev tools launched on DevHunt, ranked by developer upvotes.`;
  return {
    title,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: { canonical: page > 1 ? `/tools/${slug}?page=${page}` : `/tools/${slug}` },
    openGraph: { title, description, images: [shareImage], url: `https://devhunt.org/tools/${slug}` },
    twitter: { card: 'summary_large_image', title, description, images: [shareImage] },
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
  // Page 1 is the category hub: a data summary, an FAQ and structured data (components/ui/CategoryHub).
  const hub = page === 1 ? { name: categoryName, slug, total, top: rows, stats: await getCategoryHubStats(category.id) } : null;
  const faq = hub ? categoryFaq(hub) : [];

  return (
    <section className="max-w-4xl mt-10 mx-auto px-4 md:px-8">
      {hub && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(categoryJsonLd({ name: categoryName, slug, top: rows, faq })).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <PageHeader eyebrow="Category" title={`Best ${categoryName} tools`}>
        {categoryDescription(categoryName)} {total.toLocaleString('en-US')} tools, ranked by upvotes from the community.
      </PageHeader>
      {hub && <CategoryHubIntro {...hub} />}
      {hub && <CategoryWellKnown name={categoryName} tools={hub.stats.wellKnown} />}
      <MonitizorAdCards />
      <ol className="mt-10 mb-4">
        {rows.map((tool, idx) => [
          sponsorBefore(idx, rows.length) >= 0 && (
            <InlineSponsor
              key={`sponsor-${idx}`}
              n={sponsorBefore(idx, rows.length)}
              rank="row"
              rankDigits={String(page * LIST_PAGE_SIZE).length}
            />
          ),
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
      <ListPagination basePath={`/tools/${slug}`} page={page} totalPages={totalPages} />
      {hub && <CategoryHubFaq faq={faq} name={categoryName} />}
      <div className="mb-16" />
    </section>
  );
}
