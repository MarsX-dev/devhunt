import { type Profile } from '@/utils/supabase/types';
import Avatar from '../Avatar/Avatar';
import { IconGlobeAlt } from '@/components/Icons/IconGlobeAlt';

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
      {profile?.website_url ? (
        <div className="mt-3">
          <a
            href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
            target="_blank"
            className="inline-flex items-center gap-x-2 text-slate-500 hover:text-slate-400 text-sm duration-150"
          >
            <IconGlobeAlt />
            Website
          </a>
        </div>
      ) : (
        ''
      )}
    </div>
  </div>
);
