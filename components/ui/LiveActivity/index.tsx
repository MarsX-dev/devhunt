'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type ActivityEvent, activityVerb, timeAgo } from '@/utils/activity';

const EVERY_MS = 4500;

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

  return (
    <div id="live-activity" className="-mt-2 mb-6 flex h-8 items-center justify-center gap-x-2.5 overflow-hidden text-sm text-slate-400">
      <span className="flex flex-none items-center gap-x-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-green-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70 motion-safe:animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
        </span>
        Live
      </span>
      <div key={idx} className="flex min-w-0 items-center gap-x-2 motion-safe:animate-slide-up">
        <img
          src={event.avatar}
          alt=""
          referrerPolicy="no-referrer"
          className="h-5 w-5 flex-none rounded-full object-cover bg-slate-800"
          onError={e => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
        />
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
              <Link href={`/tool/${event.slug}`} className="text-slate-200 hover:text-slate-50">
                {event.tool}
              </Link>
            </>
          )}
          {now && <span className="text-slate-600"> · {timeAgo(event.at, now)}</span>}
        </span>
      </div>
    </div>
  );
}
