'use client';

import { useEffect, useState } from 'react';
import { type LatestComment, timeAgo } from '@/utils/activity';

// The tool's latest real comment, "arriving" once the card is on screen: a typing bubble first,
// then the message. The wrapper animates its height so the list grows smoothly instead of jumping.
export default function ArrivingComment({ comment, active }: { comment: LatestComment; active: boolean }) {
  const [stage, setStage] = useState<'hidden' | 'typing' | 'shown'>('hidden');

  useEffect(() => {
    if (!active || stage !== 'hidden') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setStage('shown');
    const typing = setTimeout(() => setStage('typing'), 600 + Math.random() * 1400);
    return () => clearTimeout(typing);
  }, [active, stage]);

  useEffect(() => {
    if (stage !== 'typing') return;
    const shown = setTimeout(() => setStage('shown'), 1100);
    return () => clearTimeout(shown);
  }, [stage]);

  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
        stage === 'hidden' ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
      }`}
      aria-hidden={stage === 'hidden'}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex items-center gap-x-2 pt-2.5">
          <img
            src={comment.avatar}
            alt=""
            referrerPolicy="no-referrer"
            className="h-5 w-5 flex-none rounded-full bg-slate-800 object-cover"
            onError={e => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
          />
          <div className="flex min-w-0 items-center gap-x-1.5 rounded-2xl rounded-tl-md bg-slate-800/70 px-3 py-1.5 text-[13px] leading-5">
            {stage === 'shown' ? (
              <>
                <span className="flex-none font-medium text-slate-200">{comment.name}</span>
                <span className="truncate text-slate-400">{comment.content}</span>
                <span className="flex-none text-slate-600">· {timeAgo(comment.at)}</span>
              </>
            ) : (
              <span className="flex h-5 items-center gap-x-1 px-0.5" aria-label="typing">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-typing" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
