'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { ArrowUpRight, CalendarClock, Trophy } from 'lucide-react';
import ButtonUpvote from '@/components/ui/ButtonUpvote';
import VoterAvatarsList, { VotersSkeleton } from '@/components/ui/VoterAvatarsList';
import WinnerBadge from '@/components/ui/WinnerBadge';
import SectionLabel from '@/components/ui/SectionLabel';
import { type ProductType } from '@/type';
import { type Profile } from '@/utils/supabase/types';
import { formatStat } from '@/utils/statFormat';
import { votingDeadline } from '@/utils/votingDeadline';
import addHttpsToUrl from '@/utils/addHttpsToUrl';
import handleURLQuery from '@/utils/handleURLQuery';

type Phase = 'upcoming' | 'live' | 'ended';

export function launchPhase(tool: Pick<ProductType, 'launch_start' | 'launch_end'>, now = Date.now()): Phase {
  if (!tool.launch_start || Date.parse(tool.launch_start) > now) return 'upcoming';
  return tool.launch_end && Date.parse(tool.launch_end) < now ? 'ended' : 'live';
}

function useMinuteClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function StatusPill({ tool, phase, weekRank }: { tool: ProductType; phase: Phase; weekRank?: number }) {
  const now = useMinuteClock();
  const base = 'inline-flex items-center gap-x-2 rounded-full border px-3 py-1 text-xs';
  if (phase === 'live') {
    const left = now ? moment.duration(votingDeadline(moment(now)).diff(moment(now))) : null;
    return (
      <span className={`${base} border-green-500/30 bg-green-500/[0.06] text-slate-300`}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        <span className="font-medium text-green-300">Live now</span>
        {weekRank ? <span className="text-slate-400">· #{weekRank} this week</span> : null}
        {left && (
          <span className="hidden font-mono text-slate-400 sm:inline">
            · voting closes in {Math.floor(left.asHours() / 24) > 0 ? `${Math.floor(left.asHours() / 24)}d ` : ''}
            {String(left.hours()).padStart(2, '0')}h {String(left.minutes()).padStart(2, '0')}m
          </span>
        )}
      </span>
    );
  }
  if (phase === 'upcoming') {
    return (
      <span className={`${base} border-slate-700 bg-slate-900 text-slate-300`}>
        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
        Launching {moment.utc(tool.launch_start).format('LL')}
        {now && <span className="text-slate-500">· {moment.utc(tool.launch_start).from(moment(now))}</span>}
      </span>
    );
  }
  const winner = weekRank && weekRank <= 3;
  return (
    <span className={`${base} ${winner ? 'border-orange-500/40 bg-orange-500/[0.06] text-orange-300' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
      {winner && <Trophy className="h-3.5 w-3.5" />}
      {winner ? `#${weekRank} Product of the week · ` : ''}Launched {moment.utc(tool.launch_start).format('LL')}
    </span>
  );
}

interface Props {
  tool: ProductType;
  owner?: Profile | null;
  weekRank?: number;
  votesToday?: number;
  commentsCount?: number;
}

// Header of a tool (page and preview modal): status, identity, actions, live stats and voters.
export default function ToolHero({ tool, owner, weekRank, votesToday = 0, commentsCount = 0 }: Props) {
  const phase = launchPhase(tool);
  const stats = [
    { label: 'Upvotes', value: formatStat(tool.votes_count ?? 0), delta: votesToday > 0 ? `+${votesToday} today` : '' },
    { label: 'Impressions', value: formatStat(tool.views_count ?? 0), delta: '' },
    phase === 'upcoming'
      ? { label: 'Launch week', value: moment.utc(tool.launch_start).format('MMM D'), delta: '' }
      : { label: phase === 'live' ? 'Rank this week' : 'Final rank', value: weekRank ? `#${weekRank}` : '–', delta: '' },
    { label: 'Comments', value: formatStat(commentsCount), delta: '' },
  ];

  return (
    <div id="about">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <StatusPill tool={tool} phase={phase} weekRank={weekRank} />
          <div className="mt-5 flex items-center gap-x-4 sm:gap-x-5">
            <img
              src={(tool.logo_url || '').replace(/w=\d+/g, 'w=160')}
              alt={tool.name}
              className="h-16 w-16 flex-none rounded-2xl bg-slate-800 object-cover ring-1 ring-slate-800 sm:h-20 sm:w-20"
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-4xl">{tool.name}</h1>
              <p className="mt-1 text-slate-400 sm:mt-1.5 sm:text-lg">{tool.slogan}</p>
            </div>
          </div>
        </div>
        <div className="hidden flex-none sm:block">
          <WinnerBadge weekRank={weekRank ?? ''} isLaunchEnd={phase === 'ended'} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <a
          href={handleURLQuery(addHttpsToUrl(tool.demo_url as string))}
          target="_blank"
          className="inline-flex items-center gap-x-1.5 rounded-full bg-slate-50 px-4 py-2 font-medium text-slate-900 duration-150 hover:bg-white"
        >
          Visit website
          <ArrowUpRight className="h-4 w-4" />
        </a>
        <ButtonUpvote
          productId={tool.id}
          count={tool.votes_count}
          launchDate={tool.launch_date}
          launchEnd={tool.launch_end as string}
          votesToday={votesToday}
        />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 sm:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-slate-900 px-4 py-3.5 sm:px-5">
            <dd className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl font-semibold tracking-tight text-slate-50 tabular-nums">{stat.value}</span>
              {stat.delta && <span className="whitespace-nowrap font-mono text-[11px] text-green-400">{stat.delta}</span>}
            </dd>
            <dt className="mt-0.5 text-xs text-slate-500">{stat.label}</dt>
          </div>
        ))}
      </dl>

      {/* owner undefined = still loading (preview modal): keep the row's space with a skeleton. */}
      {owner !== null && (
        <div className="mt-6">{owner ? <VoterAvatarsList productId={tool.id} owner={owner} /> : <VotersSkeleton />}</div>
      )}
    </div>
  );
}

// "The maker" card near the bottom of a tool page.
export function ToolMaker({ tool, owner }: { tool: ProductType; owner?: Profile | null }) {
  if (owner === null) return null;
  if (!owner)
    return (
      <div id="details" aria-busy="true">
        <SectionLabel title="The maker" />
        <div className="mt-4 flex items-center gap-x-4 rounded-2xl border border-slate-800 p-4">
          <span className="h-12 w-12 flex-none animate-pulse rounded-full bg-slate-800" />
          <span className="flex-1 space-y-2">
            <span className="block h-4 w-40 animate-pulse rounded bg-slate-800" />
            <span className="block h-3.5 w-64 max-w-full animate-pulse rounded bg-slate-800" />
          </span>
        </div>
      </div>
    );
  const phase = launchPhase(tool);
  return (
    <div id="details">
      <SectionLabel title="The maker" />
      <Link
        href={`/@${owner.username}`}
        className="group mt-4 flex items-center gap-x-4 rounded-2xl border border-slate-800 p-4 duration-150 hover:border-slate-600 hover:bg-slate-800/30"
      >
        <img
          src={owner.avatar_url as string}
          alt={owner.full_name as string}
          referrerPolicy="no-referrer"
          className="h-12 w-12 flex-none rounded-full bg-slate-800 object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-100">{owner.full_name}</p>
          <p className="truncate text-sm text-slate-400">
            {owner.headline || `@${owner.username}`} · {phase === 'upcoming' ? 'launching' : 'launched'} {tool.name}{' '}
            {moment.utc(tool.launch_start).fromNow()}
          </p>
        </div>
        <span className="flex-none text-sm text-slate-500 duration-150 group-hover:text-slate-200">View profile →</span>
      </Link>
    </div>
  );
}
