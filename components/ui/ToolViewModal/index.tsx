'use client';

import { IconArrowLongLeft } from '@/components/Icons';
import { Gallery, GalleryImage } from '@/components/ui/Gallery';
import { Tabs } from '@/components/ui/TabsLink';
import TabLink from '@/components/ui/TabsLink/TabLink';
import CommentService from '@/utils/supabase/services/comments';
import CommentSection from '@/components/ui/Client/CommentSection';
import { createBrowserClient } from '@/utils/supabase/browser';
import AwardsService from '@/utils/supabase/services/awards';
import Link from 'next/link';
import ProfileService from '@/utils/supabase/services/profile';
import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { type ProductType } from '@/type';
import { Profile } from '@/utils/supabase/types';
import { ProductAward } from '@/utils/supabase/CustomTypes';
import { useRouter } from 'next/navigation';
import TrendingToolsList from '../TrendingToolsList';
import ToolHero, { ToolMaker } from '../ToolHero';
import SectionLabel from '../SectionLabel';

// Tool preview opened from a card (same content as the tool page, loaded in the browser).
export default ({ href, tool, close, votesToday = 0 }: { href: string; tool: ProductType; close: () => void; votesToday?: number }) => {
  const supabaseBrowserClient = createBrowserClient();

  const router = useRouter();
  const [comments, setComments] = useState<any[] | null>(null); // null while loading
  const [owner, setOwner] = useState<Profile | null>(); // undefined = loading, null = none
  const [weekRank, setWeekRank] = useState<number>();

  useEffect(() => {
    const commentService = new CommentService(supabaseBrowserClient);

    commentService.getByProductId(tool.id).then(comments => {
      setComments((comments ?? []) as any[]);
    });

    new ProfileService(supabaseBrowserClient).getById(tool.owner_id as string).then(ownerData => {
      setOwner((ownerData as Profile) ?? null);
    });

    new AwardsService(supabaseBrowserClient).getWeeklyRank(tool.id).then((toolAward: ProductAward[]) => {
      setWeekRank(Number((toolAward as any)?.rank) || undefined);
    });
  }, [href]);

  const tabs = [
    { name: 'About', sectionId: 'about' },
    { name: 'Comments', sectionId: 'comments' },
    { name: 'Maker', sectionId: 'details' },
    { name: 'Trending', sectionId: 'launches' },
  ];

  return (
    <>
      <Modal
        isActive={true}
        onCancel={close}
        variant="custom"
        classNameContainer="px-0 py-0 sm:py-8"
        className="max-w-4xl bg-slate-900 px-0 py-8 view-modal sm:rounded-2xl sm:border sm:border-slate-800"
      >
        <div className="container-custom-screen flex items-center justify-between pb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-x-2 rounded-full border border-slate-800 px-3.5 py-1.5 text-sm text-slate-300 duration-150 hover:border-slate-600 hover:text-slate-50"
          >
            <IconArrowLongLeft className="h-4 w-4" />
            Back
          </button>
          <Link href={href} className="text-sm text-slate-400 duration-150 hover:text-slate-100">
            Open full page →
          </Link>
        </div>
        <div className="container-custom-screen">
          <ToolHero tool={tool} owner={owner} weekRank={weekRank} votesToday={votesToday} commentsCount={comments?.length ?? tool.comments_count ?? 0} />
        </div>
        <Tabs ulClassName="container-custom-screen gap-x-6" className="mt-12 sticky pt-2 top-0 z-10 bg-slate-900/85 backdrop-blur-md">
          {tabs.map((item, idx) => (
            <TabLink variant="nonlink" sectionId={item.sectionId} key={idx}>
              {item.name}
            </TabLink>
          ))}
        </Tabs>
        <div className="space-y-16">
          <div className="pb-4">
            <div className="container-custom-screen mt-10">
              <div
                className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: tool?.description as string }}
              ></div>
              {tool?.product_categories?.length ? (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {tool?.product_categories.map((pc: { name: string }) => (
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
            </div>
            {tool?.asset_urls?.length && (
              <div className={`max-w-screen-2xl ${tool?.asset_urls?.length === 1 ? 'container-custom-screen' : ''} mt-10 mx-auto sm:px-8`}>
                <Gallery assets={tool?.asset_urls} src={tool.demo_video_url as string} alt={tool.name}>
                  {tool?.asset_urls && tool?.asset_urls.map((item: string, idx: number) => <GalleryImage key={idx} src={item} alt={tool.name} />)}
                </Gallery>
              </div>
            )}
          </div>
          <CommentSection
            productId={tool?.owner_id as string}
            comments={(comments ?? []) as any}
            slug={tool?.slug}
            loadingCount={comments ? undefined : tool.comments_count ?? 0}
          />
          <div className="container-custom-screen">
            <ToolMaker tool={tool} owner={owner} />
          </div>
          <div className="container-custom-screen" id="launches">
            <SectionLabel title="Trending launches" />
            <TrendingToolsList excludeId={tool.id} />
          </div>
        </div>
      </Modal>
    </>
  );
};
