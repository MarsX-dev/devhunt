'use client';

import { IconInformationCircle, IconVote } from '@/components/Icons';
import mergeTW from '@/utils/mergeTW';
import { useSupabase } from '@/components/supabase/provider';
import ProductsService from '@/utils/supabase/services/products';
import Modal from '../Modal';
import { createBrowserClient } from '@/utils/supabase/browser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import customDateFromNow from '@/utils/customDateFromNow';
import LinkItem from '../Link/LinkItem';
import Button from '../Button/Button';
import ProfileService from '@/utils/supabase/services/profile';
import { hasUserVoted } from '@/utils/userVotes';

export default ({
  count,
  launchDate,
  launchEnd,
  productId = null,
  className = '',
  pending = 0,
}: {
  count?: number;
  pending?: number; // a real vote from today not shown yet; the live replay counts it up (home page)
  launchDate: string | number;
  launchEnd: string | number;
  productId?: number | null;
  className?: string;
}) => {
  const { session } = useSupabase();
  const productsService = new ProductsService(createBrowserClient());
  const profileService = new ProfileService(createBrowserClient());
  const isLaunchStarted = new Date(launchDate).getTime() <= Date.now();
  const isLaunchEnd = new Date(launchEnd).getTime() <= Date.now();

  const router = useRouter();
  const [votesCount, setVotesCount] = useState(count);
  const [isUpvoted, setUpvoted] = useState(false);
  const [isModalActive, setModalActive] = useState(false);
  const [modalInfo, setMoadlInfo] = useState({ title: '', desc: '' });
  const [touched, setTouched] = useState(false); // once the visitor votes, always show the real count
  const shownCount = (votesCount ?? 0) - (touched ? 0 : pending);

  const toggleVote = async () => {
    const profile = session && session.user ? await profileService.getByIdWithNoCache(session.user?.id) : null;
    if (session && session.user) {
      setMoadlInfo(
        new Date(launchEnd).getTime() >= Date.now()
          ? { title: 'Not Launched Yet!', desc: `Oops, this tool hasn't launched yet! Check back on ${customDateFromNow(launchDate)}.` }
          : { title: 'This tool week is ends', desc: `Oops, you missed this tool week, it was launched ${customDateFromNow(launchDate)}.` },
      );
      if (isLaunchStarted && new Date(launchEnd).getTime() >= Date.now()) {
        const newVotesCount = await productsService.toggleVote(productId as number, session.user.id);
        router.refresh();
        setUpvoted(!isUpvoted);
        setTouched(true);
        setVotesCount(newVotesCount);
      } else setModalActive(true);
    } else if (!session) router.push('/login');
    else if (profile && !profile?.social_url == null) window.location.reload();
  };

  useEffect(() => {
    if (session?.user && productId) void hasUserVoted(session.user.id, productId).then(setUpvoted);
  }, []);

  return (
    <>
      <button
        onClick={toggleVote}
        id="vote-item"
        className={mergeTW(
          `w-14 py-1.5 text-center text-slate-300 active:scale-110 duration-200 rounded-xl border bg-slate-900 ${
            isUpvoted ? 'text-orange-500 border-orange-500/70 bg-orange-500/10' : 'border-slate-800 hover:border-slate-600 hover:text-slate-50'
          } ${className} ${isLaunchEnd ? ' opacity-60' : ''}`,
        )}
      >
        <IconVote className="mt-1 w-4 h-4 mx-auto pointer-events-none" />
        <span key={shownCount} className="block font-mono text-sm tabular-nums pointer-events-none motion-safe:animate-tick">
          {shownCount}
        </span>
      </button>
      <Modal
        isActive={isModalActive}
        icon={<IconInformationCircle className="text-blue-500 w-6 h-6" />}
        title={modalInfo.title}
        description={modalInfo.desc}
        onCancel={() => setModalActive(false)}
      >
        <LinkItem href="/" className="flex-1 block w-full text-sm bg-orange-500 hover:bg-orange-400">
          Explore other tools
        </LinkItem>
        <Button
          onClick={() => setModalActive(false)}
          className="flex-1 block w-full text-sm border border-slate-700 bg-transparent hover:bg-slate-900 mt-2 sm:mt-0"
        >
          Continue
        </Button>
      </Modal>
    </>
  );
};
