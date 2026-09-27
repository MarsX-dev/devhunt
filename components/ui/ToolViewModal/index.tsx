'use client';

import { IconArrowLongLeft } from '@/components/Icons';
import { Gallery, GalleryImage } from '@/components/ui/Gallery';
import { Tabs } from '@/components/ui/TabsLink';
import TabLink from '@/components/ui/TabsLink/TabLink';
import CommentSection from '@/components/ui/Client/CommentSection';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../Modal';
import { type ProductType } from '@/type';
import { Profile } from '@/utils/supabase/types';
import { useRouter } from 'next/navigation';
import TrendingToolsList from '../TrendingToolsList';
import ToolHero, { ToolMaker } from '../ToolHero';
import SectionLabel from '../SectionLabel';
import { ProfileSource, ToolCompare, ToolFaq, ToolFeatures, ToolGlance, ToolPricing, cleanName } from '../ToolProfile';
import RequestProfile from '../ToolProfile/RequestProfile';
import { ToolAwards, ToolHighlights, ToolMentions, ToolReviews } from '../ToolExtras';
import { type ToolProfileView } from '@/utils/toolProfileData';
import { type ToolExtra } from '@/utils/toolExtras';
import { loadToolPreview } from '@/utils/toolPreview';
import { neighborCard } from '@/utils/toolCardRegistry';

// Tool preview opened from a card: the same content as the tool page (loaded in the browser), with
// previous/next buttons (and ← → keys) to step through the cards of the list without closing.
export default ({ href, tool, close, votesToday = 0 }: { href: string; tool: ProductType; close: () => void; votesToday?: number }) => {
  // Page scrolling is locked while the preview is open and always released when it goes away, however
  // that happens (Back, Escape, or "Open full page", which unmounts it along with the old page).
  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, []);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [current, setCurrent] = useState({ tool, votesToday, href });
  const [comments, setComments] = useState<any[] | null>(null); // null while loading
  const [owner, setOwner] = useState<Profile | null>(); // undefined = loading, null = none
  const [weekRank, setWeekRank] = useState<number>();
  const [profile, setProfile] = useState<ToolProfileView | null | undefined>(); // undefined = loading
  const [extras, setExtras] = useState<ToolExtra[]>([]);
  const [neighbors, setNeighbors] = useState<{ prev: boolean; next: boolean }>({ prev: false, next: false });
  const t = current.tool;

  useEffect(() => {
    setComments(null);
    setOwner(undefined);
    setWeekRank(undefined);
    setProfile(undefined);
    setExtras([]);
    setNeighbors({ prev: !!neighborCard(t.id, -1), next: !!neighborCard(t.id, 1) });
    let alive = true;
    void loadToolPreview(t.slug).then(preview => {
      if (!alive) return;
      setComments(preview?.comments ?? []);
      setOwner(preview?.owner ?? null);
      setWeekRank(preview?.weekRank ?? undefined);
      setProfile(preview?.profile ?? null);
      setExtras(preview?.extras ?? []);
    });
    // Preload the neighbours so ←/→ shows them without waiting.
    for (const direction of [-1, 1] as const) {
      const card = neighborCard(t.id, direction);
      if (card) void loadToolPreview(card.tool.slug);
    }
    return () => {
      alive = false;
    };
  }, [t.id]);

  const go = useCallback(
    (direction: 1 | -1) => {
      const card = neighborCard(current.tool.id, direction);
      if (!card) return;
      const nextHref = `/tool/${card.tool.slug}`;
      window.history.replaceState({ href: nextHref }, '', nextHref);
      setCurrent({ tool: card.tool, votesToday: card.votesToday ?? 0, href: nextHref });
      scrollRef.current?.closest('.view-modal')?.scrollTo({ top: 0 });
      document.querySelector('.view-modal')?.parentElement?.scrollTo({ top: 0 });
    },
    [current.tool.id],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, [contenteditable="true"]')) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // Profile tabs arrive after the rest loads, so they go last (nothing shifts when they appear).
  const tabs = [
    { name: 'Comments', sectionId: 'comments' },
    { name: 'About', sectionId: 'description' },
    { name: 'Maker', sectionId: 'details' },
    { name: 'Trending', sectionId: 'launches' },
    ...(profile?.data.features.length ? [{ name: 'Features', sectionId: 'features' }] : []),
    ...(profile?.compare.length ? [{ name: 'Alternatives', sectionId: 'compare' }] : []),
  ];
  const pricingTitle = t.product_pricing_types?.title ?? null;
  const navButton = 'flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 text-slate-300 duration-150 hover:border-slate-600 hover:text-slate-50 disabled:opacity-30';

  return (
    <Modal
      isActive={true}
      onCancel={close}
      variant="custom"
      classNameContainer="px-0 py-0 sm:py-8"
      className="max-w-4xl bg-slate-900 px-0 py-8 view-modal sm:rounded-2xl sm:border sm:border-slate-800"
    >
      <div ref={scrollRef} className="container-custom-screen flex items-center justify-between gap-x-3 pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-x-2 rounded-full border border-slate-800 px-3.5 py-1.5 text-sm text-slate-300 duration-150 hover:border-slate-600 hover:text-slate-50"
        >
          <IconArrowLongLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-x-2">
          <button onClick={() => go(-1)} disabled={!neighbors.prev} aria-label="Previous tool" title="Previous tool (←)" className={navButton}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => go(1)} disabled={!neighbors.next} aria-label="Next tool" title="Next tool (→)" className={navButton}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <Link href={current.href} className="ml-2 text-sm text-slate-400 duration-150 hover:text-slate-100">
            Open full page →
          </Link>
        </div>
      </div>
      <div className="container-custom-screen" key={`hero-${t.id}`}>
        <ToolHero tool={t} owner={owner} weekRank={weekRank} votesToday={current.votesToday} commentsCount={comments?.length ?? t.comments_count ?? 0} />
      </div>
      <Tabs ulClassName="container-custom-screen gap-x-6" className="mt-12 sticky pt-2 top-0 z-10 bg-slate-900/85 backdrop-blur-md">
        {tabs.map(item => (
          <TabLink variant="nonlink" sectionId={item.sectionId} key={item.sectionId}>
            {item.name}
          </TabLink>
        ))}
      </Tabs>
      <div className="mt-10 space-y-16" key={`body-${t.id}`}>
        {profile === null && <RequestProfile productId={t.id} />}
        {/* Comments first (visitors read them most); while loading, placeholders keep their height. */}
        <CommentSection
          productId={t?.owner_id as string}
          comments={(comments ?? []) as any}
          slug={t?.slug}
          loadingCount={comments ? undefined : t.comments_count ?? 0}
        />
        <div id="description" className="scroll-mt-32 pb-4">
          <div className="container-custom-screen">
            <div className="prose prose-sm prose-invert max-w-none text-slate-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: t?.description as string }}></div>
            {t?.product_categories?.length ? (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {t.product_categories.map((pc: { name: string }) => (
                  <Link
                    key={pc.name}
                    href={`/tools/${pc.name.toLowerCase().replaceAll(' ', '-')}`}
                    className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 duration-150 hover:border-slate-600 hover:text-slate-50"
                  >
                    {pc.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {t?.asset_urls?.length ? (
            <div className={`max-w-screen-2xl ${t.asset_urls.length === 1 ? 'container-custom-screen' : ''} mt-10 mx-auto sm:px-8`}>
              <Gallery assets={t.asset_urls} src={t.demo_video_url as string} alt={t.name}>
                {t.asset_urls.map((item: string, idx: number) => (
                  <GalleryImage key={idx} src={item} alt={t.name} />
                ))}
              </Gallery>
            </div>
          ) : null}
        </div>
        {/* Loaded after opening, so it sits below the gallery (out of view) and pushes nothing visible. */}
        {(profile || extras.some(e => e.kind === 'award' || e.kind === 'highlight')) && (
          <div className="container-custom-screen space-y-14">
            {profile && <ToolGlance profile={profile} />}
            {extras.some(e => e.kind === 'award' || e.kind === 'highlight') && (
              <div>
                <ToolAwards extras={extras} />
                <ToolHighlights extras={extras} />
              </div>
            )}
            {profile && (
              <>
                <ToolFeatures profile={profile} name={cleanName(t.name)} />
                <ToolPricing profile={profile} name={cleanName(t.name)} />
                <ToolCompare
                  profile={profile}
                  self={{ name: t.name, slug: t.slug, logo_url: t.logo_url, votes_count: t.votes_count, launch_start: t.launch_start, pricing: pricingTitle }}
                />
                <ToolFaq profile={profile} name={cleanName(t.name)} />
                <ProfileSource profile={profile} />
              </>
            )}
          </div>
        )}
        {extras.some(e => e.kind === 'review' || e.kind === 'mention') && (
          <div className="container-custom-screen space-y-14">
            <ToolReviews extras={extras} />
            <ToolMentions extras={extras} />
          </div>
        )}
        <div className="container-custom-screen">
          <ToolMaker tool={t} owner={owner} />
        </div>
        <div className="container-custom-screen" id="launches">
          <SectionLabel title="Trending launches" />
          <TrendingToolsList excludeId={t.id} />
        </div>
      </div>
    </Modal>
  );
};
