'use client';
import * as Avatar from '@radix-ui/react-avatar';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { Profile } from '@/utils/supabase/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Tooltip from '@radix-ui/react-tooltip';
import Button from '../Button';

export default ({ productId, owner }: { productId: number; owner: Profile }) => {
  const productsService = new ProductsService(createBrowserClient());
  const [votersList, setVotersList] = useState([]);
  const [limit, setLimit] = useState(30);

  async function getVoters() {
    let voters = await productsService.getVoters(productId);
    voters = voters.filter((item: Profile) => item.id != owner.id);
    setVotersList(voters);
  }

  useEffect(() => {
    getVoters();
  }, []);

  return (
    <ul className="max-w-4xl mx-auto gap-3 flex flex-wrap items-center">
      {[owner, ...votersList].slice(0, limit).map((item: Profile, idx) => (
        <li className="flex-none w-8 h-8 hover:scale-105 duration-200 sm:w-10 sm:h-10">
          <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Link href={`/@${item.username}`}>
                  <Avatar.Root key={idx}>
                    <Avatar.Image
                      className={`w-full h-full object-cover rounded-xl ${idx == 0 ? 'border-2 border-orange-500' : ''}`}
                      src={item.avatar_url as string}
                      alt={item.full_name as string}
                    />
                    <Avatar.Fallback
                      className="flex items-center justify-center text-slate-300 h-full w-full bg-slate-800 text-[15px] font-medium rounded-xl"
                      delayMs={600}
                    >
                      {item.full_name?.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="px-2 py-1 rounded-full text-slate-300 text-xs font-medium bg-slate-700 will-change-[transform,opacity]"
                  sideOffset={5}
                >
                  {item.full_name || 'No name'} {idx == 0 ? ' (author) ' : ''}
                  <Tooltip.Arrow className="fill-slate-700" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </li>
      ))}
      {votersList.length + 1 > 30 ? (
        <li>
          <Button
            onClick={() => setLimit(limit == votersList.length + 1 ? 30 : votersList.length + 1)}
            className="py-2 text-sm bg-transparent hover:bg-slate-800 border border-slate-800"
          >
            {limit == votersList.length + 1 ? 'Show less' : 'Show all'}
          </Button>
        </li>
      ) : (
        ''
      )}
    </ul>
  );
};
