'use client';

import moment from 'moment';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { isFinalHours, votingDeadline } from '@/utils/votingDeadline';

const SponsorSkeleton = () => (
  <div className="mt-3 w-80 text-left sm:block border border-slate-700 bg-slate-900 rounded-md p-4 animate-pulse">
    <div className="h-4 w-16 bg-slate-700 rounded mb-2"></div>
    <div className="h-6 w-3/4 bg-slate-700 rounded mb-2"></div>
    <div className="h-4 w-full bg-slate-700 rounded mb-3"></div>
    <div className="space-y-2">
      <div className="h-4 w-2/3 bg-slate-700 rounded"></div>
      <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
      <div className="h-4 w-2/3 bg-slate-700 rounded"></div>
    </div>
    <div className="h-8 w-full bg-orange-900/50 rounded mt-4"></div>
  </div>
);

const SponsorCard = ({ sponsor }) => {
  const { type, link, title, description, features, callToAction } = sponsor;

  return (
    <div className="mt-3 w-80 text-left sm:block border border-slate-700 bg-slate-900 rounded-md p-4 ">
      <span className="text-xs mb-1 block text-slate-600">{type}</span>
      <a href={link} target="_blank" rel="nofollow" className="text-slate-300 transition-opacity hover:text-slate-200">
        <div className="text text-orange-600 mb-1 font-bold">{title}</div>
        <div className="text-sm text-slate-300 justify-start mb-2">{description}</div>
        {features.map((feature, index) => (
          <div className="opacity-70" key={index}>
            → <span className="text-sm ">{feature}</span>
          </div>
        ))}
        <span className="mt-4 mb-3 block w-52 w-full bg-orange-900 text-white mx-0 p-1 text-sm rounded text-center">{callToAction}</span>
      </a>
    </div>
  );
};

const People = () => {
  const people = [
    { href: '/@johnrush', name: 'John Rush', image: 'https://pbs.twimg.com/profile_images/1466385933612240901/qNMrMDlG_200x200.jpg' },
    {
      href: '/@sididev',
      name: 'Sidi',
      image: 'https://xpdhqqwgprlqmqaqmnyx.supabase.co/storage/v1/object/public/avatars/a90fe249-313d-4546-8dd7-39028bdb8cbf/picture',
    },
    {
      href: '/@vitalik_may',
      name: 'Vitalik May',
      image: 'https://xpdhqqwgprlqmqaqmnyx.supabase.co/storage/v1/object/public/avatars/daa6aea5-8b32-4c4a-9f31-9e2183ba7fb2/picture',
    },
    { href: '/@Tpuljak', name: 'Toma Puljak', image: 'https://avatars.githubusercontent.com/u/26512078?v=4' },
    { href: '/@KilianValkhof', name: 'Kilian Valkhof', image: 'https://avatars.githubusercontent.com/u/41970?v=4' },
    { href: '/@LukeDavidBryant_ea5', name: 'Luke David Bryant', image: 'https://avatars.githubusercontent.com/u/155965955?v=4' },
    { href: '/@osslate', name: 'Fionn Kelleher', image: 'https://avatars.githubusercontent.com/u/773673?v=4' },
    { href: '/@VladIlnitskiy_0a6', name: 'Vlad Ilnitskiy', image: 'https://avatars.githubusercontent.com/u/17927972?v=4' },
    { href: '/@Leech', name: 'Leandro Ardissone', image: 'https://avatars.githubusercontent.com/u/59826?v=4' },
    { href: '/@gdraganic', name: 'Goran Draganić', image: 'https://avatars.githubusercontent.com/u/6513388?v=4' },
    { href: '/@simonds', name: 'Mark Simonds', image: 'https://avatars.githubusercontent.com/u/138306?v=4' },
    {
      href: '/@G_67d',
      name: 'Will',
      image: 'https://xpdhqqwgprlqmqaqmnyx.supabase.co/storage/v1/object/public/avatars/0cfecc23-276f-4ff9-a404-6837c47bbdfb/picture',
    },
    { href: '/@NikolaosSakellarios_05e', name: 'Nikolaos Sakellarios', image: 'https://avatars.githubusercontent.com/u/3863839?v=4' },
    { href: '/@KevinMarville_e30', name: 'Kevin Marville', image: 'https://avatars.githubusercontent.com/u/116537485?v=4' },
    { href: '/@TomislavJakopec_26f', name: 'Tomislav Jakopec', image: 'https://avatars.githubusercontent.com/u/7893782?v=4' },
    { href: '/@DavorRunje_af9', name: 'Davor Runje', image: 'https://avatars.githubusercontent.com/u/24715380?v=4' },
    { href: '/@shpetimselaci', name: 'Shpetim Selaci', image: 'https://avatars.githubusercontent.com/u/23242179?v=4' },
    { href: '/@ZacharySmith_edd', name: 'Zachary Smith', image: 'https://avatars.githubusercontent.com/u/1000528?v=4' },
    { href: '/@amirrustam', name: 'Amir R.', image: 'https://avatars.githubusercontent.com/u/334337?v=4' },
    { href: '/@FernandoBold_531', name: 'Fernando Bold', initials: '...' },
  ];

  return (
    <ul className="flex -space-x-2">
      {people
        .filter(person => person.image)
        .slice(0, 8)
        .map(person => (
          <li key={person.href} className="flex-none hover:z-10 hover:-translate-y-0.5 duration-150">
            <a href={person.href} title={person.name}>
              <img className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-900" alt={person.name} src={person.image} />
            </a>
          </li>
        ))}
    </ul>
  );
};

function useNow() {
  const [now, setNow] = useState<moment.Moment | null>(null);
  useEffect(() => {
    setNow(moment().utc());
    const timer = setInterval(() => setNow(moment().utc()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function TimePart({ value, unit, tick = false }: { value: string; unit: string; tick?: boolean }) {
  return (
    <span className="inline-flex items-baseline rounded-md border border-slate-700/80 bg-slate-950/60 px-1.5 py-0.5">
      <span key={tick ? value : undefined} className={`text-slate-50 ${tick ? 'inline-block motion-safe:animate-tick' : ''}`}>
        {value}
      </span>
      <span className="text-slate-500">{unit}</span>
    </span>
  );
}

// Live "voting closes in" pill: the heart and the ring beat every second, faster and red in the
// final 24 hours.
function VotingCountdown() {
  const now = useNow();
  const diff = now ? moment.duration(votingDeadline(now).diff(now)) : null;
  const final = !!now && isFinalHours(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  const color = final ? 'text-rose-400' : 'text-orange-400';

  return (
    <span
      style={{ ['--beat-color' as string]: final ? 'rgb(244 63 94 / 0.45)' : 'rgb(249 115 22 / 0.4)' }}
      className={`inline-flex items-center gap-x-2.5 rounded-full border py-1.5 pl-3 pr-1.5 text-sm backdrop-blur ${
        final ? 'border-rose-500/50 bg-rose-500/[0.08]' : 'border-orange-500/40 bg-orange-500/[0.06]'
      } ${now ? (final ? 'motion-safe:animate-heartbeat-ring-fast' : 'motion-safe:animate-heartbeat-ring') : ''}`}
    >
      <Heart
        aria-hidden
        className={`h-4 w-4 flex-none fill-current ${color} ${final ? 'motion-safe:animate-heartbeat-fast' : 'motion-safe:animate-heartbeat'}`}
      />
      {final ? (
        <span className="font-medium text-rose-200">
          Final hours!<span className="hidden sm:inline"> Voting closes in</span>
        </span>
      ) : (
        <span className="text-slate-300">Voting closes in</span>
      )}
      <span className="flex items-center gap-x-1 font-mono text-[13px] tabular-nums">
        {diff ? (
          <>
            {Math.floor(diff.asHours() / 24) > 0 && <TimePart value={String(Math.floor(diff.asHours() / 24))} unit="d" />}
            <TimePart value={pad(diff.hours())} unit="h" />
            <TimePart value={pad(diff.minutes())} unit="m" />
            <TimePart value={pad(diff.seconds())} unit="s" tick />
          </>
        ) : (
          // Same shape as the running timer (days, hours, minutes, seconds) before it starts.
          <>
            <TimePart value="-" unit="d" />
            <TimePart value="--" unit="h" />
            <TimePart value="--" unit="m" />
            <TimePart value="--" unit="s" />
          </>
        )}
      </span>
    </span>
  );
}

const SponsorsSection = () => {
  const [sponsors, setSponsors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const response = await fetch('https://d1gl9g4ciwvjfq.cloudfront.net/api/GetDevhuntAds');
        if (!response.ok) throw new Error('Failed to fetch sponsors');
        const data = await response.json();
        setSponsors(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  if (error) {
    return <div className="text-red-500 p-4">Error loading sponsors</div>;
  }

  return (
    <div className="block sm:flex gap-2">
      {isLoading ? (
        <>
          <SponsorSkeleton />
          <SponsorSkeleton />
        </>
      ) : (
        sponsors.map((sponsor, index) => <SponsorCard key={index} sponsor={sponsor} />)
      )}
    </div>
  );
};

export default ({ uniqueVisitors }: { uniqueVisitors?: number }) => (
  <div className="relative isolate pt-6 pb-10 sm:pt-12 text-center">
    <div aria-hidden className="bg-dot-grid pointer-events-none absolute -inset-x-40 -top-24 h-[460px] -z-10" />
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-x-40 -top-24 -z-10 h-[420px] bg-[radial-gradient(ellipse_40%_50%_at_50%_0%,rgb(249_115_22/0.07),transparent)]"
    />
    <VotingCountdown />
    <h1 className="mt-6 text-[2rem] font-semibold tracking-tight text-slate-50 leading-[1.1] [text-wrap:balance] sm:text-6xl sm:leading-[1.05]">
      The best new dev tools, <br className="hidden sm:block" />
      <span className="text-slate-500">voted by developers.</span>
    </h1>
    <p className="mt-5 mx-auto max-w-lg text-slate-400">
      New launches every Tuesday. The community votes all week, and the top tool is crowned the winner.
    </p>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-400">
      <People />
      <span>
        {(uniqueVisitors ?? 452356).toLocaleString('en-US')} unique visitors since launch ·{' '}
        <a className="text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-slate-100" href="https://x.com/johnrush/status/1661534492949872641">
          how it started
        </a>
      </span>
    </div>
  </div>
);
