'use client';
import * as Avatar from '@radix-ui/react-avatar';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { Profile } from '@/utils/supabase/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default ({ productId }: { productId: number }) => {
  const productsService = new ProductsService(createBrowserClient());
  const [votersList, setVotersList] = useState([]);

  async function getVoters() {
    setVotersList(await productsService.getVoters(productId));
  }

  useEffect(() => {
    getVoters();
  }, []);

  return (
    <ul className="max-w-4xl mx-auto px-4 gap-3 flex flex-wrap items-center justify-center">
      {votersList.map((item: Profile, idx) => (
        <li className="flex-none w-8 h-8 hover:scale-105 duration-200 sm:w-10 sm:h-10">
          <Link href={`/@${item.username}`}>
            <Avatar.Root key={idx}>
              <Avatar.Image
                className="w-full h-full object-cover rounded-xl"
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
        </li>
      ))}
    </ul>
  );
};
