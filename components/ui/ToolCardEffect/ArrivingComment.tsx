'use client';

import { useEffect, useState } from 'react';
import { type LatestComment, timeAgo } from '@/utils/activity';

// The tool's latest real comment, "arriving" once the card is on screen: a typing bubble first,
// then the message. Its space is reserved from the start and it only fades in, so nothing moves.
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
      className={`transition-[opacity,transform] duration-500 ease-out ${stage === 'hidden' ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100'}`}
      aria-hidden={stage === 'hidden'}
    >
      {/* A terminal-style reply line under the tool: "↳ name  comment · 2h ago". */}
      <div className="flex min-w-0 items-center gap-x-2 text-[13px] leading-5">
        <span className="flex-none font-mono text-slate-600" aria-hidden>
          ↳
        </span>
        <img
          src={comment.avatar}
          alt=""
          referrerPolicy="no-referrer"
          className="h-4 w-4 flex-none rounded-full bg-slate-800 object-cover"
          onError={e => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
        />
        {stage === 'shown' ? (
          <>
            <span className="flex-none font-medium text-slate-300">{comment.name}</span>
            <span className="truncate text-slate-400">{comment.content}</span>
            <span className="flex-none font-mono text-xs text-slate-600">· {timeAgo(comment.at)}</span>
          </>
        ) : (
          <span className="flex h-5 items-center gap-x-1" aria-label="typing">
            {[0, 150, 300].map(delay => (
              <span key={delay} className="h-1 w-1 rounded-full bg-slate-500 animate-typing" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
