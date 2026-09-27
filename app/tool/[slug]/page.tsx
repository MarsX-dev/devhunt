import dynamic from 'next/dynamic';
import { Gallery, GalleryImage } from '@/components/ui/Gallery';
import { Tabs } from '@/components/ui/TabsLink';

const TabLink = dynamic(() => import('@/components/ui/TabsLink/TabLink'), { ssr: false });
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

const TrendingToolsList = dynamic(() => import('@/components/ui/TrendingToolsList'), { ssr: false });
import { Profile } from '@/utils/supabase/types';
import MonitizorAdCards from '@/components/ui/MonitizerAdCards';
import ToolHero, { ToolMaker } from '@/components/ui/ToolHero';
import SectionLabel from '@/components/ui/SectionLabel';
import { ToolAwards, ToolHighlights, ToolMentions, ToolReviews } from '@/components/ui/ToolExtras';
import { getToolExtras } from '@/utils/toolExtras';
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
  const product = await productsService.getBySlug(slug, true);
  if (!product || product.deleted) notFound();

  const awardService = new AwardsService(supabaseBrowserClient);
  const commentService = new CommentService(supabaseBrowserClient);

  const owned$ = new ProfileService(supabaseBrowserClient).getById(product.owner_id as string);
  const toolAward$ = awardService.getProductRanks(product.id);
  const comments$ = commentService.getByProductId(product.id);

  const [owned, weekAward, comments] = await Promise.all([owned$, toolAward$, comments$]);

  const weekRank = Number((weekAward[0] as any)?.rank) || undefined;
  const [activity, extras] = await Promise.all([getRecentActivity(), getToolExtras(product.id)]);
  const votesToday = activity?.votes_today?.[product.id] ?? 0;

  const tabs = [
    { name: 'About', hash: '#' },
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
    ...((product as any).product_pricing_types?.title === 'Free' ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } } : {}),
  };

  return (
    <section className="mt-10 pb-10 sm:mt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <div className="container-custom-screen">
        <ToolHero
          tool={product as ProductType}
          owner={owned as Profile}
          weekRank={weekRank}
          votesToday={votesToday}
          commentsCount={(comments as unknown[] | null)?.length ?? 0}
        />
        <ToolAwards extras={extras} />
      </div>
      <Tabs ulClassName="container-custom-screen gap-x-6" className="mt-12 sticky pt-2 top-[3.75rem] z-10 bg-slate-900/85 backdrop-blur-md">
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
