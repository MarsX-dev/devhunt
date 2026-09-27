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
    <div id="live-activity" className="flex h-9 items-center gap-x-2 overflow-hidden px-4 font-mono text-xs text-slate-500">
      <span className="flex-none text-green-400" aria-label="Live">
        &gt;
      </span>
      <div key={idx} className="flex min-w-0 items-center gap-x-2 motion-safe:animate-slide-up">
        <img
          src={event.avatar}
          alt=""
          referrerPolicy="no-referrer"
          className="h-4 w-4 flex-none rounded-full bg-slate-800 object-cover"
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
              <Link href={`/tool/${event.slug}`} className="text-orange-300 hover:text-orange-200">
                {event.tool}
              </Link>
            </>
          )}
          {now && <span className="text-slate-600"> · {timeAgo(event.at, now)}</span>}
        </span>
      </div>
      <span className="inline-block h-3.5 w-1.5 flex-none bg-slate-500 motion-safe:animate-pulse" aria-hidden />
    </div>
  );
}
