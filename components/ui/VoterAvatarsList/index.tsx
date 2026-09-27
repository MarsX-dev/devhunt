'use client';
import * as Avatar from '@radix-ui/react-avatar';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { Profile } from '@/utils/supabase/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Tooltip from '@radix-ui/react-tooltip';

const STACKED = 12; // fits one line on a phone

function Face({ person, isMaker, small }: { person: Profile; isMaker: boolean; small?: boolean }) {
  const size = small ? 'h-6 w-6' : 'h-8 w-8';
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Link href={`/@${person.username}`} className="block">
          {/* Fixed-size slot: the face takes its space before the image loads (no layout shift). */}
          <Avatar.Root className={`block rounded-full bg-slate-800 ${size}`}>
            <Avatar.Image
              className={`${size} rounded-full object-cover ring-2 ${isMaker ? 'ring-orange-500' : 'ring-slate-900'}`}
              src={person.avatar_url as string}
              alt={person.full_name as string}
            />
            <Avatar.Fallback
              className={`flex ${size} items-center justify-center rounded-full bg-slate-800 text-[10px] font-medium text-slate-300 ring-2 ${
                isMaker ? 'ring-orange-500' : 'ring-slate-900'
              }`}
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

// Same height as the loaded row, so nothing below it moves.
export function VotersSkeleton({ small }: { small?: boolean }) {
  const size = small ? 'h-6 w-6' : 'h-8 w-8';
  return (
    <div className={`flex items-center gap-x-3 ${small ? 'h-6' : 'h-8'}`} aria-busy="true" aria-label="Loading voters">
      <div className="flex -space-x-2">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`${size} animate-pulse rounded-full bg-slate-800 ring-2 ring-slate-900`} />
        ))}
      </div>
      <span className="hidden h-3 w-28 animate-pulse rounded bg-slate-800 sm:block" />
    </div>
  );
}

// The maker (orange ring) and the people who upvoted, as one stacked row; "+N" expands to everyone.
export default ({ productId, owner, small }: { productId: number; owner: Profile; small?: boolean }) => {
  const [voters, setVoters] = useState<Profile[] | null>(null); // null while loading
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    new ProductsService(createBrowserClient()).getVoters(productId).then(list => {
      setVoters((list as Profile[]).filter(item => item.id != owner.id));
    });
  }, [productId, owner.id]);

  if (!voters) return <VotersSkeleton small={small} />;
  const people = [owner, ...voters];
  const shown = expanded ? people : people.slice(0, STACKED);
  const hidden = people.length - shown.length;

  return (
    <Tooltip.Provider delayDuration={200}>
      {/* One line until expanded (same height as the skeleton); the count text is desktop-only. */}
      <div id="voters" className={`flex ${small ? 'min-h-6 text-xs' : 'min-h-8'} items-center gap-x-3 gap-y-2 ${expanded ? 'flex-wrap' : 'flex-nowrap'}`}>
        <ul className={expanded ? 'flex flex-wrap gap-1.5' : `flex flex-none ${small ? '-space-x-1.5' : '-space-x-2'}`}>
          {shown.map((person, idx) => (
            <li key={person.id ?? idx} className="relative flex-none duration-150 hover:z-10 hover:-translate-y-0.5">
              <Face person={person} isMaker={idx === 0} small={small} />
            </li>
          ))}
        </ul>
        {hidden > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="flex-none rounded-full border border-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400 duration-150 hover:border-slate-600 hover:text-slate-100"
          >
            +{hidden} more
          </button>
        )}
        <span className={`hidden truncate text-slate-500 sm:inline ${small ? 'text-xs' : 'text-sm'}`}>
          {voters.length > 0 ? `${voters.length} ${voters.length === 1 ? 'person' : 'people'} upvoted` : 'Be the first to upvote'}
        </span>
      </div>
    </Tooltip.Provider>
  );
};
