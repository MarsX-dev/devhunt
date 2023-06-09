'use client';
import { IconVote } from '@/components/Icons';
import Button from '@/components/ui/Button';
import React, { useEffect, useState } from 'react';
import { useSupabase } from '@/components/supabase/provider';
import ProductsService from '@/utils/supabase/services/products';
import { createBrowserClient } from '@/utils/supabase/browser';
import { useRouter } from 'next/navigation';
import Modal from '../Modal';
import customDateFromNow from '@/utils/customDateFromNow';
import { IconInformationCircle } from '@/components/Icons';
import LinkItem from '../Link/LinkItem';

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  count: number;
  className?: string;
  productId?: number;
  launchDate?: string | number;
}

export default ({ count, productId, className = '', launchDate = '', ...props }: Props) => {
  // call to trigger a vote
  // client only -- move to client component for Voting
  const { session } = useSupabase();
  const productsService = new ProductsService(createBrowserClient());
  const router = useRouter();
  const [votesCount, setVotesCount] = useState(count);
  const [isUpvoted, setUpvoted] = useState(false);
  const [isModalActive, setModalActive] = useState(false);

  const isLaunchStarted = new Date(launchDate).getTime() <= Date.now();

  const toggleVote = async () => {
    if (session && session.user) {
      if (isLaunchStarted) {
        const newVotesCount = await productsService.toggleVote(productId as number, session.user.id);
        setUpvoted(!isUpvoted);
        setVotesCount(newVotesCount);
      } else setModalActive(true);
    } else router.push('/login');
  };

  useEffect(() => {
    session && session.user
      ? productsService.getUserVoteById(session.user.id, productId as number).then(data => {
          if (data?.user_id) setUpvoted(true);
          else setUpvoted(false);
        })
      : null;
  }, []);

  return (
    <>
      <Button
        onClick={toggleVote}
        {...props}
        className={`flex items-center gap-x-3 bg-transparent duration-200 ${
          isUpvoted
            ? 'border border-orange-500 hover:border-orange-600 hover:text-orange-500 group/bar'
            : 'bg-orange-500 hover:bg-orange-700 active:bg-orange-600'
        } ${className}`}
      >
        <div className="flex items-center gap-x-2">
          <IconVote className="w-5 h-5" />
          {votesCount}
        </div>
        <span className="w-px h-4 bg-orange-300 group-hover/bar:bg-orange-500"></span>
        {isUpvoted ? 'Upvoted' : 'Upvote'}
      </Button>
      <Modal
        isActive={isModalActive}
        icon={<IconInformationCircle className="text-blue-500 w-6 h-6" />}
        title="Not Launched Yet!"
        description={`Oops, this tool hasn't launched yet! Check back on ${customDateFromNow(launchDate)}.`}
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
