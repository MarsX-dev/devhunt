import dynamic from 'next/dynamic';
import { RowsSkeleton } from '@/components/ui/Skeletons/PageSkeletons';
import { MediaGrid } from '@/components/ui/Gallery';
import { Tabs } from '@/components/ui/TabsLink';

// Rendered on the server so the tab bar has its height from the first paint.
import TabLink from '@/components/ui/TabsLink/TabLink';
import CommentSection from '@/components/ui/Client/CommentSection';
import { getWeekRank } from '@/utils/weekRank';
import { getToolPageData } from '@/utils/toolPageData';
import { type Metadata } from 'next';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const TrendingToolsList = dynamic(() => import('@/components/ui/TrendingToolsList'), {
  ssr: false,
  loading: () => <RowsSkeleton rows={8} className="mt-2" ranked />,
});
import { Profile } from '@/utils/supabase/types';
import MonitizorAdCards from '@/components/ui/MonitizerAdCards';
import ToolHero, { ToolMaker } from '@/components/ui/ToolHero';
import SectionLabel from '@/components/ui/SectionLabel';
import { ToolAwards, ToolHighlights, ToolMentions, ToolReviews } from '@/components/ui/ToolExtras';
import { sectionShown } from '@/utils/toolProfile';
import { ProfileSource, cleanName, ToolCompare, ToolFaq, ToolFeatures, ToolGlance, ToolPricing, faqJsonLd } from '@/components/ui/ToolProfile';
import RequestProfile from '@/components/ui/ToolProfile/RequestProfile';
import TrackToolView from '@/components/ui/TrackToolView';
import { OwnerDofollowUpsell } from '@/components/ui/DofollowUpsell';
import { getRecentActivity } from '@/utils/recentActivity';
import { type ProductType } from '@/type';
import { usableVideoUrl } from '@/utils/demoVideo';
import { withLinkRels } from '@/utils/links';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Cached after the first visit (CDN); nothing is built ahead. Next 14 caches a not-found page with its
// 404 status (13.5 cached it as 200, so this page used to render on every request).
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

const addHttps = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

// Slogan plus the start of the description, as plain text up to ~160 characters.
function metaDescription(slogan?: string | null, description?: string | null) {
  const text = (description ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const full = [slogan?.trim(), text].filter(Boolean).join(' - ');
  if (full.length <= 160) return full;
  const cut = full.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(' '))}...`;
}

// set dynamic metadata
export async function generateMetadata({ params: { slug } }: { params: { slug: string } }): Promise<Metadata> {
  const tool = (await getToolPageData(slug))?.product;
  if (!tool) return { title: 'Page not found - Dev Hunt' };

  const description = metaDescription(tool.slogan, tool.description);
  return {
    title: `${tool?.name} - ${tool?.slogan}`,
    description,
    metadataBase: new URL('https://devhunt.org'),
    alternates: {
      canonical: `/tool/${slug}`,
    },
    openGraph: {
      type: 'article',
      title: `${tool?.name} - ${tool?.slogan}`,
      description,
      images: tool?.asset_urls ?? [],
      url: `https://devhunt.org/tool/${slug}`,
    },
    twitter: {
      title: `${tool?.name} - ${tool?.slogan}`,
      description,
      card: 'summary_large_image',
      images: tool?.asset_urls ?? [],
    },
  };
}

export default async function Page({ params: { slug } }: { params: { slug: string } }): Promise<JSX.Element> {
  // Hidden tools (website dead or hijacked) are a 404 (the owner sees why in their dashboard): the page
  // is the same for everyone, so it can't depend on who is signed in.
  const data = await getToolPageData(slug);
  if (!data) notFound();
  const { product, owner: owned, comments, extras, profile } = data;

  const [weekRank, activity] = await Promise.all([getWeekRank(product), getRecentActivity()]);
  const pricingTitle: string | null = (product as any).product_pricing_types?.title ?? null;
  const votesToday = activity?.votes_today?.[product.id] ?? 0;

  const tabs = [
    // Comments come first on the page (visitors read them most), right under the tabs. The tab carries
    // the count, so the section itself needs no heading.
    { name: 'Comments', hash: '#comments', isActive: true, count: product.comments_count ?? 0 },
    { name: 'About', hash: '#description' },
    ...(profile?.data.features.length && sectionShown(profile.data, 'features') ? [{ name: 'Features', hash: '#features' }] : []),
    ...(profile?.compare.length && sectionShown(profile.data, 'compare') ? [{ name: 'Alternatives', hash: '#compare' }] : []),
    { name: 'Maker', hash: '#details' },
    { name: 'Trending', hash: '#launches' },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: metaDescription(product.slogan, product.description),
    url: `https://devhunt.org/tool/${product.slug}`,
    sameAs: product.demo_url ? [addHttps(product.demo_url)] : undefined,
    image: product.logo_url ?? undefined,
    screenshot: product.asset_urls?.[0] ?? undefined,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    ...(pricingTitle === 'Free' ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } } : {}),
    ...(profile?.data.features.length ? { featureList: profile.data.features.map(f => f.title) } : {}),
  };
  const faqData = profile ? faqJsonLd(profile) : null;

  return (
    <section className="mt-10 pb-10 sm:mt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      {faqData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData).replace(/</g, '\\u003c') }} />}
      {!profile && <RequestProfile productId={product.id} />}
      <TrackToolView productId={product.id} />
      <div className="container-custom-screen">
        <ToolHero
          tool={product as ProductType}
          owner={owned as Profile}
          weekRank={weekRank}
          votesToday={votesToday}
          commentsCount={product.comments_count ?? 0} // kept by a trigger; excludes deleted comments
        />
        <OwnerDofollowUpsell
          tool={{ id: product.id, slug: product.slug, isPaid: product.isPaid, launch_start: product.launch_start, moderation: (product as any).moderation, owner_id: product.owner_id }}
        />
        <ToolAwards extras={extras} />
      </div>
      <Tabs ulClassName="container-custom-screen gap-x-6" className="mt-12 sticky pt-2 top-12 z-10 bg-slate-900/85 backdrop-blur-md">
        {tabs.map((item, idx) => (
          <TabLink hash={item.hash} isActive={item.isActive} key={idx}>
            {item.name}
            {item.count ? <span className="ml-1.5 font-mono text-xs text-slate-500 tabular-nums">{item.count}</span> : null}
          </TabLink>
        ))}
      </Tabs>
      <div className="mt-6 space-y-16">
        <CommentSection productId={product.owner_id as string} comments={comments as any} slug={slug} />
        <div id="description" className="scroll-mt-32 pb-4">
          <div className="container-custom-screen">
            <div
              className="prose prose-sm prose-invert max-w-none text-slate-300 whitespace-pre-wrap"
              // Use DOMPurify method for XSS sanitizeration
              dangerouslySetInnerHTML={{ __html: withLinkRels(DOMPurify.sanitize(product?.description as string), { paid: !!product.isPaid }) }}
            ></div>
            {product?.product_categories.length ? (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {product?.product_categories.map((pc: any) => (
                  <Link
                    key={pc.name}
                    href={`/tools/${pc.name.toLowerCase().replaceAll(' ', '-')}`}
                    className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 duration-150 hover:border-slate-600 hover:text-slate-50"
                  >
                    {pc.name}
                  </Link>
                ))}
              </div>
            ) : (
              ''
            )}
            <ToolHighlights extras={extras} />
            {profile && <ToolGlance profile={profile} paid={!!product.isPaid} />}
          </div>
          {product?.asset_urls?.length || usableVideoUrl(product?.demo_video_url) ? (
            <div className="container-custom-screen mt-10">
              <MediaGrid images={product?.asset_urls ?? []} video={product?.demo_video_url} alt={product.name} />
            </div>
          ) : null}
        </div>
        {profile && (
          <div className="container-custom-screen space-y-14">
            <ToolFeatures profile={profile} name={cleanName(product.name)} />
            <ToolPricing profile={profile} name={cleanName(product.name)} paid={!!product.isPaid} />
            <ToolCompare
              profile={profile}
              self={{ name: product.name, slug: product.slug, logo_url: product.logo_url, votes_count: product.votes_count, launch_start: product.launch_start, pricing: pricingTitle }}
            />
            <ToolFaq profile={profile} name={cleanName(product.name)} />
            <ProfileSource profile={profile} />
          </div>
        )}
        {extras.some(e => e.kind === 'review' || e.kind === 'mention') && (
          <div className="container-custom-screen space-y-14">
            <ToolReviews extras={extras} />
            <ToolMentions extras={extras} />
          </div>
        )}
        <div className="container-custom-screen">
          <ToolMaker tool={product as ProductType} owner={owned as Profile} />
        </div>
        <div className="container-custom-screen">
          <MonitizorAdCards />
        </div>
        <div className="container-custom-screen" id="launches">
          <SectionLabel title="Trending launches" />
          <TrendingToolsList excludeId={product.id} />
        </div>
      </div>
    </section>
  );
}
