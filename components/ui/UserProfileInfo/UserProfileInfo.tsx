import { type Profile } from '@/utils/supabase/types';
import Avatar from '../Avatar/Avatar';
import { IconGlobeAlt } from '@/components/Icons/IconGlobeAlt';
import { ReactNode } from 'react';
import { AtSymbolIcon } from '@heroicons/react/24/solid';

function ShowElement({ children, val }: { children: ReactNode; val: any }) {
  return val ? <>{children}</> : <></>;
}

export default ({ profile }: { profile: Profile }) => (
  <div className="space-y-10">
    <div className="items-center gap-x-6 sm:flex">
      <Avatar className="w-20 h-20 flex-none" src={(profile?.avatar_url as string) || '/user.svg'} alt={profile?.full_name as string} />
      <div className="mt-4 sm:mt-0">
        <h1 className="text-2xl text-slate-50 font-medium">{profile?.full_name || 'DevHunt user'}</h1>
        <p className="mt-1 text-sm text-slate-400">{profile?.headline}</p>
      </div>
    </div>
    <div>
      <p className="text-slate-400">{profile?.about}</p>
      <div className="mt-3 flex gap-3">
        <ShowElement val={profile?.website_url}>
          <a
            href={profile.website_url && profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
            target="_blank"
            className="inline-flex items-center gap-x-2 text-slate-500 hover:text-slate-400 text-sm duration-150"
          >
            <IconGlobeAlt />
            Website
          </a>
        </ShowElement>
        <ShowElement val={profile?.social_url}>
          <a
            href={profile.social_url || ''}
            target="_blank"
            className="inline-flex items-center gap-x-2 text-slate-500 hover:text-slate-400 text-sm duration-150"
          >
            <AtSymbolIcon className="w-5 h-5" />
            Social Media
          </a>
        </ShowElement>
      </div>
    </div>
  </div>
);
