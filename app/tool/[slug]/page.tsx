import { IconVote, IconChartBar, IconArrowTopRight, IconEye } from '@/components/Icons';
import ButtonUpvote from '@/components/ui/ButtonUpvote';
import { Gallery, GalleryImage } from '@/components/ui/Gallery';
import LinkShiny from '@/components/ui/LinkShiny';
import ProductLogo from '@/components/ui/ToolCard/Tool.Logo';
import { Stat, StatsWrapper, StatCountItem, StatItem } from '@/components/ui/Stats';
import { TabLink, Tabs } from '@/components/ui/TabsLink';
import { Tag, TagsGroup } from '@/components/ui/TagsGroup';
import ToolName from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import ToolCard from '@/components/ui/ToolCard/ToolCard';
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
import ToolVotes from '@/components/ui/ToolCard/Tool.Votes';
import customDateFromNow from '@/utils/customDateFromNow';
import Page404 from '@/components/ui/Page404/Page404';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// set dynamic metadata
export async function generateMetadata({ params: { slug } }: { params: { slug: string } }): Promise<Metadata> {
  const supabaseClient = createServerClient();
  const productsService = new ProductsService(supabaseClient);
  const tool = await productsService.getBySlug(slug);

  return {
    title: `${tool?.name} - ${tool?.slogan}`,
    description: tool?.slogan,
    openGraph: {
      type: 'article',
      title: `${tool?.name} - ${tool?.slogan}`,
      description: tool?.slogan ?? '',
      images: tool?.asset_urls ?? [],
    },
    twitter: {
      title: `${tool?.name} - ${tool?.slogan}`,
      description: tool?.slogan ?? '',
      card: 'summary_large_image',
      images: tool?.asset_urls ?? [],
    },
  };
}

export default async function Page({ params: { slug } }: { params: { slug: string } }): Promise<JSX.Element> {
  const supabaseClient = createServerClient();
  const supabaseBrowserClient = createBrowserClient();

  const productsService = new ProductsService(supabaseClient);
  const product = await productsService.getBySlug(slug, true);
  if (!product || product.deleted) return <Page404 />;

  const owned = await new ProfileService(supabaseBrowserClient).getById(product.owner_id as string);
  const awardService = new AwardsService(supabaseBrowserClient);
  const toolAward = await awardService.getProductRanks(product.id);
  const dayAward = toolAward.find(i => i.award_type === 'day');
  const weekAward = toolAward.find(i => i.award_type === 'week');

  if (!product) {
    return <div>Not found</div>;
  }

  const isLaunchStarted = new Date(product.launch_date).getTime() <= Date.now();

  const trendingTools = await awardService.getWinnersOfTheDay(new Date().toISOString(), 10);

  const commentService = new CommentService(supabaseClient);
  const comments = (await commentService.getByProductId(product.id)) ?? [];

  const tabs = [
    {
      name: 'About product',
      hash: '#',
    },
    {
      name: 'Comments',
      hash: '#comments',
    },
    {
      name: 'Launch details',
      hash: '#details',
    },
    {
      name: 'Related launches',
      hash: '#launches',
    },
  ];

  const stats = [
    {
      count: product.votes_count,
      icon: <IconVote />,
      label: 'Upvotes',
    },
    {
      count: product.views_count,
      icon: <IconEye />,
      label: 'Views',
    },
    // TODO add calculation of rank in week and day
    {
      count: `#${dayAward?.rank}`,
      icon: <IconChartBar />,
      label: 'Day rank',
    },
    {
      count: `#${weekAward?.rank}`,
      icon: <IconChartBar />,
      label: 'Week rank',
    },
  ];

  return (
    <section className="mt-20 pb-10">
      <div className="container-custom-screen" id="about">
        <ProductLogo src={product?.logo_url} alt={product?.slogan as string} />
        <h1 className="mt-3 text-slate-100 font-medium">{product?.name}</h1>
        <Title className="mt-1">{product?.slogan}</Title>
        <div className="text-sm mt-3 flex items-center gap-x-3">
          <LinkShiny
            href={product?.demo_url ?? ''}
            target="_balnk"
            rel="nofollow noopener noreferrer"
            className="flex items-center gap-x-2"
          >
            Live preview
            <IconArrowTopRight />
          </LinkShiny>
          <ButtonUpvote productId={product?.id} count={product?.votes_count} launchDate={product.launch_date} />
        </div>
      </div>
      <Tabs ulClassName="container-custom-screen" className="mt-20 sticky pt-2 top-[3.75rem] z-10 bg-slate-900">
        {tabs.map((item, idx) => (
          <TabLink hash={item.hash} key={idx}>
            {item.name}
          </TabLink>
        ))}
      </Tabs>
      <div className="space-y-20">
        <div>
          <div className="relative overflow-hidden pb-12">
            <div className="absolute top-0 w-full h-[100px] opacity-40 bg-[linear-gradient(180deg,_rgba(124,_58,_237,_0.06)_0%,_rgba(72,_58,_237,_0)_100%)]"></div>
            <div className="relative container-custom-screen mt-12">
              <div
                className="prose text-slate-100 whitespace-pre-wrap"
                // Use DOMPurify method for XSS sanitizeration
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product?.description as string) }}
              ></div>
              {product?.product_categories.length ? (
                <div className="mt-6 flex flex-wrap gap-3 items-center">
                  <h3 className="text-sm text-slate-400 font-medium">Classified in</h3>
                  <TagsGroup>
                    {product?.product_categories.map(pc => (
                      <Tag>{pc.name}</Tag>
                    ))}
                  </TagsGroup>
                </div>
              ) : (
                ''
              )}
            </div>
            {product?.asset_urls?.length && (
              <div
                className={`max-w-screen-2xl ${product?.asset_urls?.length === 1 ? 'container-custom-screen' : ''} mt-10 mx-auto sm:px-8`}
              >
                <Gallery assets={product?.asset_urls} src={product.demo_video_url as string}>
                  {product?.asset_urls &&
                    product?.asset_urls.map((item: string, idx: number) => <GalleryImage key={idx} src={item} alt="" />)}
                </Gallery>
              </div>
            )}
          </div>
        </div>
        <CommentSection productId={product.owner_id as string} comments={comments as any} slug={slug} />
        {/* Keep doing based on Product interface */}
        <div className="container-custom-screen" id="details">
          <h3 className="text-slate-50 font-medium">About this launch</h3>
          <p className="text-slate-300 mt-6">
            {product.name} {isLaunchStarted ? 'was hunted by' : 'by'}{' '}
            <Link href={`/@${owned?.username}`} className="text-orange-500 hover:text-orange-400 duration-150">
              {owned?.full_name}
            </Link>{' '}
            {isLaunchStarted ? 'in ' : 'Will be launched in '}
            {customDateFromNow(product.launch_date)}.
          </p>
          {isLaunchStarted ? (
            <div className="mt-10">
              <StatsWrapper>
                {stats.map((item, idx) => (
                  <Stat key={idx} className="py-4">
                    <StatCountItem>{item.count}</StatCountItem>
                    <StatItem className="mt-2">
                      {item.icon}
                      {item.label}
                    </StatItem>
                  </Stat>
                ))}
              </StatsWrapper>
            </div>
          ) : null}
        </div>
        <div className="container-custom-screen" id="launches">
          <h3 className="text-slate-50 font-medium">Trending launches</h3>
          <ul className="mt-3 divide-y divide-slate-800/60">
            {trendingTools?.map((item, idx) => (
              <li key={idx} className="py-3">
                <ToolCard href={`/tool/${(item.slug as string).toLowerCase()}`}>
                  <ProductLogo src={item.logo_url as string} alt={item?.slogan as string} imgClassName="w-14 h-14" />
                  <div className="space-y-1">
                    <ToolName>{item.name}</ToolName>
                    <Title className="line-clamp-1 sm:line-clamp-2">{item?.slogan}</Title>
                    <Tags items={[item.product_pricing, ...(item.product_categories ?? [])]} />
                  </div>
                  <div className="flex-1 self-center flex justify-end">
                    <ToolVotes count={item.votes_count as number} />
                  </div>
                </ToolCard>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
