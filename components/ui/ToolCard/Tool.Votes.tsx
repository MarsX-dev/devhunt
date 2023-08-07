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
import { createPortal } from 'react-dom';

export default ({
  count,
  launchDate,
  productId = null,
  className = '',
}: {
  count?: number;
  launchDate: string | number;
  productId?: number | null;
  className?: string;
}) => {
  const { session } = useSupabase();
  const productsService = new ProductsService(createBrowserClient());
  const isLaunchStarted = new Date(launchDate).getTime() <= Date.now();

  const router = useRouter();
  const [votesCount, setVotesCount] = useState(count);
  const [isUpvoted, setUpvoted] = useState(false);
  const [isModalActive, setModalActive] = useState(false);

  const toggleVote = async () => {
    if (session && session.user) {
      if (isLaunchStarted) {
        const newVotesCount = await productsService.toggleVote(productId as number, session.user.id);
        router.refresh();
        setUpvoted(!isUpvoted);
        setVotesCount(newVotesCount);
      } else setModalActive(true);
    } else router.push('/login');
  };

  useEffect(() => {
    session && session.user
      ? productsService.getUserVoteById(session.user.id, productId as number).then(data => {
          if ((data as { user_id: string })?.user_id) setUpvoted(true);
          else setUpvoted(false);
        })
      : null;
  }, []);

  return (
    <>
      <div
        onClick={toggleVote}
        id="vote-item"
        className={mergeTW(
          `text-center text-slate-400 active:scale-[1.5] duration-200 ${
            isUpvoted ? 'text-orange-600' : 'hover:text-orange-300'
          } ${className}`,
        )}
      >
        <IconVote className="w-6 h-6 mx-auto pointer-events-none" />
        <span className="text-sm pointer-events-none">{votesCount}</span>
      </div>
      {createPortal(
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
        </Modal>,
        document.body,
      )}
    </>
  );
};
