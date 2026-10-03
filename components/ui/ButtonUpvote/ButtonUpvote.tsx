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
import FloatingUpvotes from '../ToolCardEffect/FloatingUpvotes';
import { useIsomorphicLayoutEffect } from '@/utils/useIsomorphicLayoutEffect';
import { hasUserVoted } from '@/utils/userVotes';

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  count: number;
  className?: string;
  productId?: number;
  launchDate: string | number;
  launchEnd: string | number;
  votesToday?: number; // real votes in the last 24 hours, replayed as floating upvotes
}

export default ({ count, productId, className = '', launchDate = '', launchEnd = '', votesToday = 0, ...props }: Props) => {
  // call to trigger a vote
  // client only -- move to client component for Voting
  const { session } = useSupabase();
  const productsService = new ProductsService(createBrowserClient());
  const router = useRouter();
  const [votesCount, setVotesCount] = useState(count);
  const [isUpvoted, setUpvoted] = useState(false);
  const [isModalActive, setModalActive] = useState(false);
  const [modalInfo, setMoadlInfo] = useState({ title: '', desc: '' });
  // Like the home cards: show today's last real vote as pending until the replay counts it up.
  const [pendingVote, setPendingVote] = useState(false);
  useIsomorphicLayoutEffect(() => {
    if (votesToday > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPendingVote(true);
  }, [votesToday]);

  const shadowElRef = useRef<HTMLDivElement>(null);
  const voteCountRef = useRef<HTMLSpanElement>(null);

  const isLaunchStarted = new Date(launchDate).getTime() <= Date.now();

  const toggleVote = async () => {
    if (session && session.user) {
      setMoadlInfo(
        new Date(launchEnd).getTime() >= Date.now()
          ? { title: 'Not Launched Yet!', desc: `Oops, this tool hasn't launched yet! Check back on ${customDateFromNow(launchDate)}.` }
          : { title: 'Voting has ended', desc: `Voting for this tool closed at the end of its launch week. It launched ${customDateFromNow(launchDate)}.` },
      );
      if (isLaunchStarted && new Date(launchEnd).getTime() >= Date.now()) {
        const newVotesCount = await productsService.toggleVote(productId as number, session.user.id);
        setUpvoted(!isUpvoted);
        setPendingVote(false);
        setTimeout(() => setVotesCount(newVotesCount), 50);
      } else setModalActive(true);
    } else if (!session) router.push('/login');
  };

  useEffect(() => {
    if (session?.user && productId) void hasUserVoted(session.user.id, productId).then(setUpvoted);
  }, [session?.user?.id, productId]); // the session loads in the browser after the first render

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

  return (
    <>
      <span className="relative inline-flex">
        <Button
          onClick={toggleVote}
          {...props}
          onMouseMove={handleHoverEffect}
          // Both states have a 1px border (transparent until voted), so voting never changes the size.
          className={`flex items-center gap-x-2.5 rounded-full border px-4 py-2 font-medium active:scale-[0.98] overflow-hidden relative duration-200 group ${
            isUpvoted
              ? 'bg-orange-500/10 border-orange-500/70 text-orange-400 hover:bg-orange-500/15'
              : 'border-transparent bg-orange-500 hover:bg-orange-400 text-white shadow-[0_8px_24px_-8px_rgba(249,115,22,0.6)]'
          } ${className}`}
        >
          <IconVote className="w-4 h-4" />
          {isUpvoted ? 'Upvoted' : 'Upvote'}
          <span className={`w-px h-4 ${isUpvoted ? 'bg-orange-500/50' : 'bg-white/40'}`}></span>
          <span ref={voteCountRef} key={votesCount - (pendingVote ? 1 : 0)} className="font-mono tabular-nums duration-150 motion-safe:animate-tick">
            {votesCount - (pendingVote ? 1 : 0)}
          </span>
          <div
            ref={shadowElRef}
            className={`absolute top-0 left-0 w-9 h-9 bg-gradient-to-tr blur-[20px] opacity-0 group-hover:opacity-100 duration-150 ${
              isUpvoted ? 'from-orange-300/40 to-orange-500/40' : 'from-white/60 to-white/30'
            }`}
          ></div>
        </Button>
        <FloatingUpvotes votesToday={votesToday} active={true} onBurst={() => setPendingVote(false)} ringClassName="rounded-full" />
      </span>
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
          Close
        </Button>
      </Modal>
    </>
  );
};
