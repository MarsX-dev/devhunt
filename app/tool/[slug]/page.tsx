import dynamic from 'next/dynamic';
import { RowsSkeleton } from '@/components/ui/Skeletons/PageSkeletons';
import { Gallery, GalleryImage } from '@/components/ui/Gallery';
import { Tabs } from '@/components/ui/TabsLink';

// Rendered on the server so the tab bar has its height from the first paint.
import TabLink from '@/components/ui/TabsLink/TabLink';
import ProductsService from '@/utils/supabase/services/products';
import CommentService from '@/utils/supabase/services/comments';
import CommentSection from '@/components/ui/Client/CommentSection';
import { createServerClient } from '@/utils/supabase/server';
import { createBrowserClient } from '@/utils/supabase/browser';
import AwardsService from '@/utils/supabase/services/awards';
import { type Metadata } from 'next';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import Link from 'next/link';
import ProfileService from '@/utils/supabase/services/profile';
import { notFound } from 'next/navigation';

const TrendingToolsList = dynamic(() => import('@/components/ui/TrendingToolsList'), {
  ssr: false,
  loading: () => <RowsSkeleton rows={8} className="mt-2" />,
});
import { Profile } from '@/utils/supabase/types';
import MonitizorAdCards from '@/components/ui/MonitizerAdCards';
import ToolHero, { ToolMaker } from '@/components/ui/ToolHero';
import SectionLabel from '@/components/ui/SectionLabel';
import { ToolAwards, ToolHighlights, ToolMentions, ToolReviews } from '@/components/ui/ToolExtras';
import { getToolExtras } from '@/utils/toolExtras';
import { getToolProfile } from '@/utils/toolProfileData';
import { sectionShown } from '@/utils/toolProfile';
import { ProfileSource, cleanName, ToolCompare, ToolFaq, ToolFeatures, ToolGlance, ToolPricing, faqJsonLd } from '@/components/ui/ToolProfile';
import RequestProfile from '@/components/ui/ToolProfile/RequestProfile';
import { getRecentActivity } from '@/utils/recentActivity';
import { type ProductType } from '@/type';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export const revalidate = 60;

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
  const supabaseClient = createServerClient();
  const productsService = new ProductsService(supabaseClient);
  const tool = await productsService.getBySlug(slug);
  if (!tool || tool.deleted) return { title: 'Page not found - Dev Hunt' };

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
  // const supabaseBrowserClient = createServerClient();
  const supabaseBrowserClient = createBrowserClient();

  const productsService = new ProductsService(supabaseBrowserClient);
  // Hidden tools (website dead or hijacked) only load for their owner, through the signed-in client.
  const product = (await productsService.getBySlug(slug, true)) ?? (await new ProductsService(createServerClient()).getBySlug(slug));
  if (!product || product.deleted) notFound();
  const hidden = (product as any).site_status && (product as any).site_status !== 'ok';

  const awardService = new AwardsService(supabaseBrowserClient);
  const commentService = new CommentService(supabaseBrowserClient);

  const owned$ = new ProfileService(supabaseBrowserClient).getById(product.owner_id as string);
  const toolAward$ = awardService.getProductRanks(product.id);
  const comments$ = commentService.getByProductId(product.id);

  const [owned, weekAward, comments] = await Promise.all([owned$, toolAward$, comments$]);

  const weekRank = Number((weekAward[0] as any)?.rank) || undefined;
  const [activity, extras, profile] = await Promise.all([getRecentActivity(), getToolExtras(product.id), getToolProfile(product.id)]);
  const pricingTitle: string | null = (product as any).product_pricing_types?.title ?? null;
  const votesToday = activity?.votes_today?.[product.id] ?? 0;

  const tabs = [
    { name: 'About', hash: '#' },
    ...(profile?.data.features.length && sectionShown(profile.data, 'features') ? [{ name: 'Features', hash: '#features' }] : []),
    ...(profile?.compare.length && sectionShown(profile.data, 'compare') ? [{ name: 'Alternatives', hash: '#compare' }] : []),
    { name: 'Comments', hash: '#comments' },
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
      <div className="container-custom-screen">
        {hidden && (
          <div role="alert" className="mb-8 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">
            <strong className="font-medium">Only you can see this page.</strong> We hid {product.name} from DevHunt because its website looks{' '}
            {(product as any).site_status === 'hijacked' ? 'hijacked' : 'down'}
            {(product as any).site_status_reason ? ` (${(product as any).site_status_reason})` : ''}. Once the site is back, it&apos;s restored automatically at the
            next check, or{' '}
            <a className="underline" href="https://x.com/johnrush" target="_blank" rel="noopener">
              contact us
            </a>
            .
          </div>
        )}
        <ToolHero
          tool={product as ProductType}
          owner={owned as Profile}
          weekRank={weekRank}
          votesToday={votesToday}
          commentsCount={(comments as unknown[] | null)?.length ?? 0}
        />
        <ToolAwards extras={extras} />
      </div>
      <Tabs ulClassName="container-custom-screen gap-x-6" className="mt-12 sticky pt-2 top-12 z-10 bg-slate-900/85 backdrop-blur-md">
        {tabs.map((item, idx) => (
          <TabLink hash={item.hash} key={idx}>
            {item.name}
          </TabLink>
        ))}
      </Tabs>
      <div className="space-y-16">
        <div className="pb-4">
          <div className="container-custom-screen mt-10">
            <div
              className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap"
              // Use DOMPurify method for XSS sanitizeration
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product?.description as string) }}
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
            {profile && <ToolGlance profile={profile} />}
          </div>
          {product?.asset_urls?.length && (
            <div className={`max-w-screen-2xl ${product?.asset_urls?.length === 1 ? 'container-custom-screen' : ''} mt-10 mx-auto sm:px-8`}>
              <Gallery assets={product?.asset_urls} alt={product.name} src={product.demo_video_url as string}>
                {product?.asset_urls &&
                  product?.asset_urls.map((item: string, idx: number) => (
                    <GalleryImage key={idx} src={item.replaceAll('&fit=max&w=750', '')} alt={product.name} />
                  ))}
              </Gallery>
            </div>
          )}
        </div>
        {profile && (
          <div className="container-custom-screen space-y-14">
            <ToolFeatures profile={profile} name={cleanName(product.name)} />
            <ToolPricing profile={profile} name={cleanName(product.name)} />
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
        <CommentSection productId={product.owner_id as string} comments={comments as any} slug={slug} />
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
