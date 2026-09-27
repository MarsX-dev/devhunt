import { type Profile } from '@/utils/supabase/types';
import { formatStat } from '@/utils/statFormat';
import { linkLabel, normalizeUrl, platformName, profileLinks, type SocialLink } from '@/utils/socialLinks';
import SocialIcon from '@/components/ui/SocialIcon';

export interface ProfileStats {
  launches: number;
  upvotesReceived: number;
  upvotesGiven: number;
  comments: number;
}

// Profile header: identity, links and a stats bar in the same style as the tool pages.
export default ({ profile, stats }: { profile: Profile; stats?: ProfileStats }) => {
  const items = stats
    ? [
        { label: 'Launches', value: stats.launches },
        { label: 'Upvotes received', value: stats.upvotesReceived },
        { label: 'Upvotes given', value: stats.upvotesGiven },
        { label: 'Comments', value: stats.comments },
      ]
    : [];
  // The website first, then the social profiles; old rows (social_url only) are parsed on the fly.
  const website = normalizeUrl(profile?.website_url);
  const links: SocialLink[] = [
    ...(website ? [{ platform: 'website' as const, handle: website, url: website }] : []),
    ...profileLinks(profile ?? {}).filter(link => link.url !== website),
  ];
  return (
    <div>
      <div className="flex items-center gap-x-4 sm:gap-x-5">
        <img
          src={(profile?.avatar_url as string) || '/user.svg'}
          alt={profile?.full_name as string}
          referrerPolicy="no-referrer"
          className="h-16 w-16 flex-none rounded-full bg-slate-800 object-cover ring-1 ring-slate-800 sm:h-20 sm:w-20"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">{profile?.full_name || 'DevHunt user'}</h1>
          <p className="mt-1 text-slate-400">
            {profile?.headline || `@${profile?.username}`}
            {stats && stats.launches > 0 && (
              <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full border border-orange-500/40 bg-orange-500/[0.06] px-2 py-0.5 align-middle text-[11px] font-medium text-orange-300">
                Maker
              </span>
            )}
          </p>
        </div>
      </div>
      {profile?.about && <p className="mt-5 max-w-2xl text-slate-300">{profile.about}</p>}
      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {links.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="nofollow ugc noopener"
              title={platformName(link.platform)}
              className="inline-flex max-w-full items-center gap-x-1.5 rounded-full border border-slate-800 px-3 py-1 text-slate-300 duration-150 hover:border-slate-600 hover:text-slate-50"
            >
              <SocialIcon platform={link.platform} className="h-3.5 w-3.5 flex-none" />
              <span className="truncate">{linkLabel(link)}</span>
            </a>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 sm:grid-cols-4">
          {items.map(item => (
            <div key={item.label} className="bg-slate-900 px-4 py-3.5">
              <dd className="text-xl font-semibold tracking-tight text-slate-50 tabular-nums">{formatStat(item.value)}</dd>
              <dt className="mt-0.5 text-xs text-slate-500">{item.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};
