'use client';
import { IconVote } from '@/components/Icons';
import Button from '@/components/ui/Button';
import React, { MouseEventHandler, useEffect, useRef, useState } from 'react';
import { useSupabase } from '@/components/supabase/provider';
import ProductsService from '@/utils/supabase/services/products';
import { createBrowserClient } from '@/utils/supabase/browser';
import { useRouter } from 'next/navigation';
import Modal from '../Modal';
import customDateFromNow from '@/utils/customDateFromNow';
import { IconInformationCircle } from '@/components/Icons';
import LinkItem from '../Link/LinkItem';
import ProfileService from '@/utils/supabase/services/profile';

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  count: number;
  className?: string;
  productId?: number;
  launchDate: string | number;
  launchEnd: string | number;
}

export default ({ count, productId, className = '', launchDate = '', launchEnd = '', ...props }: Props) => {
  // call to trigger a vote
  // client only -- move to client component for Voting
  const { session } = useSupabase();
  const productsService = new ProductsService(createBrowserClient());
  const profileService = new ProfileService(createBrowserClient());
  const router = useRouter();
  const [votesCount, setVotesCount] = useState(count);
  const [isUpvoted, setUpvoted] = useState(false);
  const [isModalActive, setModalActive] = useState(false);
  const [modalInfo, setMoadlInfo] = useState({ title: '', desc: '' });

  const shadowElRef = useRef<HTMLDivElement>(null);
  const voteCountRef = useRef<HTMLSpanElement>(null);

  const isLaunchStarted = new Date(launchDate).getTime() <= Date.now();

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
        voteCountEffect();
        setTimeout(() => setVotesCount(newVotesCount), 50);
      } else setModalActive(true);
    } else if (!session) router.push('/login');
    else if (profile && !profile?.social_url == null) window.location.reload();
  };

  useEffect(() => {
    session && session.user
      ? productsService.getUserVoteById(session.user.id, productId as number).then(data => {
          if ((data as { user_id: string })?.user_id) setUpvoted(true);
          else setUpvoted(false);
        })
      : null;
  }, []);

  const handleHoverEffect: MouseEventHandler<HTMLButtonElement> = e => {
    const button = e.currentTarget;
    const shadowEl = shadowElRef.current as HTMLElement;

    const rect = button.getBoundingClientRect();
    const x = e.pageX - rect.left;
    const y = e.pageY - rect.top;

    shadowEl.style.top = `${y}px`;
    shadowEl.style.left = `${x}px`;
    shadowEl.style.transform = 'translate(-50%, -50%)';
  };

  const voteCountEffect = () => {
    const voteCountEl = voteCountRef.current as HTMLSpanElement;
    voteCountEl.style.transform = `translateY(${isUpvoted ? '' : '-'}50px)`;
    setTimeout(() => {
      voteCountEl.style.transform = 'translateY(0px)';
    }, 300);
  };

  return (
    <>
      <Button
        onClick={toggleVote}
        {...props}
        onMouseMove={handleHoverEffect}
        className={`flex items-center gap-x-3 hover:scale-[1.02] active:scale-100 ring-offset-1 ring-orange-500 focus:ring-2 bg-transparent overflow-hidden relative duration-200 group ${
          isUpvoted
            ? 'focus:ring-offset-0 focus:ring-0 border border-orange-500 text-orange-500'
            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-600'
        } ${className}`}
      >
        <div className="flex items-center gap-x-2">
          <IconVote className="w-4 h-4" />
          <span ref={voteCountRef} className="duration-150">
            {votesCount}
          </span>
        </div>
        <span className={`w-px h-4 ${isUpvoted ? 'bg-orange-500' : 'bg-orange-300'}`}></span>
        {isUpvoted ? 'Upvoted' : 'Upvote'}
        <div
          ref={shadowElRef}
          className={`absolute top-0 left-0 w-9 h-9 bg-gradient-to-tr blur-[20px] opacity-0 group-hover:opacity-100 duration-150 ${
            isUpvoted ? 'from-slate-300 to-slate-500' : 'from-slate-50 to-slate-100'
          }`}
        ></div>
      </Button>
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
