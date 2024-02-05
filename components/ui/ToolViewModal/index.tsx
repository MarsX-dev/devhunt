'use client';

import { IconVote, IconChartBar, IconArrowTopRight, IconFire, IconLoading, IconArrowLongLeft } from '@/components/Icons';
import ButtonUpvote from '@/components/ui/ButtonUpvote';
import { Gallery, GalleryImage } from '@/components/ui/Gallery';
import LinkShiny from '@/components/ui/LinkShiny';
import ProductLogo from '@/components/ui/ToolCard/Tool.Logo';
import { Stat, StatsWrapper, StatCountItem, StatItem } from '@/components/ui/Stats';
import { Tabs } from '@/components/ui/TabsLink';
import TabLink from '@/components/ui/TabsLink/TabLink';
import { Tag, TagsGroup } from '@/components/ui/TagsGroup';
import Title from '@/components/ui/ToolCard/Tool.Title';
import CommentService, { ProductComment } from '@/utils/supabase/services/comments';
import CommentSection from '@/components/ui/Client/CommentSection';
import { createBrowserClient } from '@/utils/supabase/browser';
import AwardsService from '@/utils/supabase/services/awards';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import Link from 'next/link';
import ProfileService from '@/utils/supabase/services/profile';
import customDateFromNow from '@/utils/customDateFromNow';
import addHttpsToUrl from '@/utils/addHttpsToUrl';
import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { type ProductType } from '@/type';
import { Profile } from '@/utils/supabase/types';
import { ProductAward } from '@/utils/supabase/CustomTypes';
import { useRouter } from 'next/navigation';
import TrendingToolsList from './TrendingToolsList';
import WinnerBadge from '../WinnerBadge';
import handleURLQuery from '@/utils/handleURLQuery';
import VoterAvatarsList from '../VoterAvatarsList';

export default ({ href, tool, close }: { href: string; tool: ProductType; close: () => void }) => {
  // const window = new JSDOM('').window;
  // const DOMPurify = createDOMPurify(window);

  const supabaseBrowserClient = createBrowserClient();

  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [owner, setOwner] = useState<Profile>();
  const [weekRank, setWeekRank] = useState<string>('');

  useEffect(() => {
    const commentService = new CommentService(supabaseBrowserClient);

    commentService.getByProductId(tool.id).then(comments => {
      setComments(comments as any);
    });

    new ProfileService(supabaseBrowserClient).getById(tool.owner_id as string).then(ownerData => {
      setOwner(ownerData as Profile);
    });

    new AwardsService(supabaseBrowserClient).getWeeklyRank(tool.id).then((toolAward: ProductAward[]) => {
      setWeekRank(toolAward.rank + '');
    });
  }, [href]);

  const isLaunchStarted = new Date(tool?.launch_date).getTime() <= Date.now();
  const isLaunchEnd = new Date(tool.launch_end as string).getTime() <= Date.now();

  const tabs = [
    {
      name: 'About product',
      sectionId: 'about',
    },
    {
      name: 'Comments',
      sectionId: 'comments',
    },
    {
      name: 'Launch details',
      sectionId: 'details',
    },
    {
      name: 'Related launches',
      sectionId: 'launches',
    },
  ];

  const stats = [
    {
      count: tool?.votes_count,
      icon: <IconVote />,
      label: 'Upvotes',
    },
    {
      count: tool?.views_count,
      icon: <IconFire />,
      label: 'Impressions',
    },
    // TODO add calculation of rank in week and day
    // {
    //   count: `#${dayAward?.rank}`,
    //   icon: <IconChartBar />,
    //   label: 'Day rank',
    // },
    {
      count: `#${weekRank}`,
      icon: <IconChartBar />,
      label: 'Week rank',
    },
  ];

  return (
    <>
      <Modal
        isActive={true}
        onCancel={close}
        variant="custom"
        classNameContainer="px-0 py-0 sm:py-8"
        className="max-w-4xl bg-slate-900 px-0 py-8 view-modal"
      >
        <div>
          <div className="container-custom-screen pt-4 pb-10">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-x-2 py-2 px-4 text-slate-50 border border-slate-700 rounded-lg hover:bg-slate-800 duration-150"
            >
              <IconArrowLongLeft />
              Go back
            </button>
          </div>
          <div className="container-custom-screen" id="about">
            <div className="flex items-center justify-between">
              <ProductLogo src={tool?.logo_url} alt={tool?.slogan as string} />
              <WinnerBadge weekRank={weekRank} isLaunchEnd={isLaunchEnd} />
            </div>
            <h1 className="mt-3 text-slate-100 font-medium">{tool?.name}</h1>
            <Title className="mt-1">{tool?.slogan}</Title>
            <div className="text-sm mt-3 flex items-center gap-x-3">
              <LinkShiny
                href={handleURLQuery(addHttpsToUrl(tool?.demo_url as string))}
                target="_blank"
                className="flex items-center gap-x-2"
              >
                Live preview
                <IconArrowTopRight />
              </LinkShiny>
              <ButtonUpvote
                productId={tool?.id}
                count={tool?.votes_count}
                launchDate={tool?.launch_date}
                launchEnd={tool.launch_end as string}
              />
            </div>
            <div className="mt-10">{owner ? <VoterAvatarsList productId={tool.id} owner={owner as Profile} /> : ''}</div>
          </div>
        </div>
        <Tabs ulClassName="container-custom-screen" className="mt-20 sticky pt-2 top-0 z-10 bg-slate-900">
          {tabs.map((item, idx) => (
            <TabLink variant="nonlink" sectionId={item.sectionId} key={idx}>
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
                  dangerouslySetInnerHTML={{ __html: tool?.description as string }}
                ></div>
                {tool?.product_categories?.length ? (
                  <div className="mt-6 flex flex-wrap gap-3 items-center">
                    <h3 className="text-sm text-slate-400 font-medium">Classified in</h3>
                    <TagsGroup>
                      {tool?.product_categories.map((pc: { name: string }) => (
                        <Tag href={`/tools/${pc.name.toLowerCase().replaceAll(' ', '-')}`}>{pc.name}</Tag>
                      ))}
                    </TagsGroup>
                  </div>
                ) : (
                  ''
                )}
              </div>
              {tool?.asset_urls?.length && (
                <div
                  className={`max-w-screen-2xl ${tool?.asset_urls?.length === 1 ? 'container-custom-screen' : ''} mt-10 mx-auto sm:px-8`}
                >
                  <Gallery assets={tool?.asset_urls} src={tool.demo_video_url as string} alt={tool.name}>
                    {tool?.asset_urls &&
                      tool?.asset_urls.map((item: string, idx: number) => <GalleryImage key={idx} src={item} alt={tool.name} />)}
                  </Gallery>
                </div>
              )}
            </div>
          </div>
          <CommentSection productId={tool?.owner_id as string} comments={comments as any} slug={tool?.slug} />
          {/* Keep doing based on Product interface */}
          <div className="container-custom-screen" id="details">
            <h3 className="text-slate-50 font-medium">About this launch</h3>
            <p className="text-slate-300 mt-6">
              {tool?.name} {isLaunchStarted ? 'was launched by' : 'by'}{' '}
              <Link href={`/@${owner?.username}`} className="text-orange-500 hover:text-orange-400 duration-150">
                {owner?.full_name}
              </Link>{' '}
              {isLaunchStarted ? 'in ' : 'Will be launched '}
              {customDateFromNow(tool?.launch_date)}.
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
            <TrendingToolsList />
          </div>
        </div>
      </Modal>
    </>
  );
};
