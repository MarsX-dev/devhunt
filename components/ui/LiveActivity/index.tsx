'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type ActivityEvent, activityVerb, timeAgo } from '@/utils/activity';

const EVERY_MS = 4500;

// Avatar with the person's initial behind it, so a broken image never leaves an empty circle.
function Face({ src, name, className }: { src: string; name: string; className: string }) {
  return (
    <span className={`relative flex flex-none items-center justify-center overflow-hidden rounded-full bg-slate-800 text-[9px] uppercase text-slate-400 ${className}`}>
      {name.slice(0, 1)}
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover"
        onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
      />
    </span>
  );
}

// One subtle line that cycles through what real people just did on DevHunt.
export default function LiveActivity({ events }: { events: ActivityEvent[] }) {
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % events.length);
      setNow(Date.now());
    }, EVERY_MS);
    return () => clearInterval(timer);
  }, [events.length]);

  if (!events.length) return null;
  const event = events[idx];
  // The latest people who upvoted something, shown as a small stack on the right.
  const upvoters = events
    .filter(e => e.type === 'upvoted' && e.avatar)
    .filter((e, i, all) => all.findIndex(x => x.name === e.name) === i)
    .slice(0, 8);

  return (
    <div id="live-activity" className="flex h-9 items-center gap-x-2 overflow-hidden px-4 font-mono text-xs text-slate-500">
      <span className="flex-none text-green-400" aria-label="Live">
        &gt;
      </span>
      <div key={idx} className="flex min-w-0 items-center gap-x-2 motion-safe:animate-slide-up">
        <Face src={event.avatar} name={event.name} className="h-4 w-4" />
        <span className="truncate">
          {event.username ? (
            <Link href={`/@${event.username}`} className="text-slate-200 hover:text-slate-50">
              {event.name}
            </Link>
          ) : (
            <span className="text-slate-200">{event.name}</span>
          )}{' '}
          {activityVerb[event.type]}
          {event.tool && event.slug && (
            <>
              {' '}
              <Link href={`/tool/${event.slug}`} className="text-orange-300 hover:text-orange-200">
                {event.tool}
              </Link>
            </>
          )}
          {now && <span className="text-slate-600"> · {timeAgo(event.at, now)}</span>}
        </span>
      </div>
      <span className="inline-block h-3.5 w-1.5 flex-none bg-slate-500 motion-safe:animate-pulse" aria-hidden />
      {upvoters.length > 2 && (
        <div className="ml-auto hidden flex-none items-center gap-x-2 sm:flex" aria-label="Recent upvoters">
          <div className="flex -space-x-1.5">
            {upvoters.map(u => (
              <span key={u.name} title={`${u.name} upvoted ${u.tool ?? ''}`} className="rounded-full ring-2 ring-slate-950">
                <Face src={u.avatar} name={u.name} className="h-5 w-5" />
              </span>
            ))}
          </div>
          <span className="text-slate-600">upvoting</span>
        </div>
      )}
    </div>
  );
}
