'use client';
import * as Avatar from '@radix-ui/react-avatar';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { Profile } from '@/utils/supabase/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Tooltip from '@radix-ui/react-tooltip';

const STACKED = 14;

function Face({ person, isMaker }: { person: Profile; isMaker: boolean }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Link href={`/@${person.username}`} className="block">
          <Avatar.Root>
            <Avatar.Image
              className={`h-8 w-8 rounded-full object-cover ring-2 ${isMaker ? 'ring-orange-500' : 'ring-slate-900'}`}
              src={person.avatar_url as string}
              alt={person.full_name as string}
            />
            <Avatar.Fallback
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[11px] font-medium text-slate-300 ring-2 ${
                isMaker ? 'ring-orange-500' : 'ring-slate-900'
              }`}
              delayMs={600}
            >
              {person.full_name?.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
        </Link>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200" sideOffset={5}>
          {person.full_name || 'No name'}
          {isMaker ? ' (maker)' : ''}
          <Tooltip.Arrow className="fill-slate-700" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// The maker (orange ring) and the people who upvoted, as one stacked row; "+N" expands to everyone.
export default ({ productId, owner }: { productId: number; owner: Profile }) => {
  const [voters, setVoters] = useState<Profile[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    new ProductsService(createBrowserClient()).getVoters(productId).then(list => {
      setVoters((list as Profile[]).filter(item => item.id != owner.id));
    });
  }, [productId, owner.id]);

  const people = [owner, ...voters];
  const shown = expanded ? people : people.slice(0, STACKED);
  const hidden = people.length - shown.length;

  return (
    <Tooltip.Provider delayDuration={200}>
      <div id="voters" className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ul className={expanded ? 'flex flex-wrap gap-1.5' : 'flex -space-x-2'}>
          {shown.map((person, idx) => (
            <li key={person.id ?? idx} className="relative flex-none duration-150 hover:z-10 hover:-translate-y-0.5">
              <Face person={person} isMaker={idx === 0} />
            </li>
          ))}
        </ul>
        {hidden > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="rounded-full border border-slate-800 px-2.5 py-1 font-mono text-xs text-slate-400 duration-150 hover:border-slate-600 hover:text-slate-100"
          >
            +{hidden} more
          </button>
        )}
        <span className="text-sm text-slate-500">
          {voters.length > 0 ? `${voters.length} ${voters.length === 1 ? 'person' : 'people'} upvoted` : 'Be the first to upvote'}
        </span>
      </div>
    </Tooltip.Provider>
  );
};
