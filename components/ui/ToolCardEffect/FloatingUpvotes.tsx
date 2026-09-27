'use client';

import { useEffect, useState } from 'react';
import { IconVote } from '@/components/Icons';

type Particle = { id: number; drift: number; delay: number; plusOne: boolean };

const MAX_BURSTS = 12; // per page visit and tool

// Replays a tool's real votes from the last 24 hours as upvotes floating up from its vote button,
// at most one burst per real vote per minute. The first burst reports back (onBurst) so the card
// can count its last real vote up; later bursts don't change the count.
export default function FloatingUpvotes({ votesToday, active, onBurst }: { votesToday: number; active: boolean; onBurst?: () => void }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active || votesToday <= 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let bursts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const every = Math.max(4000, 60_000 / Math.min(votesToday, 6));

    const burst = () => {
      const id = Date.now();
      const count = 2 + Math.floor(Math.random() * 2);
      const next: Particle[] = Array.from({ length: count }, (_, i) => ({
        id: id + i,
        drift: Math.round((Math.random() - 0.5) * 28),
        delay: i * 140,
        plusOne: i === 0,
      }));
      setParticles(current => [...current, ...next]);
      onBurst?.();
      setTimeout(() => setParticles(current => current.filter(p => p.id < id || p.id >= id + count)), 1400 + count * 140);
      if (++bursts < MAX_BURSTS) timer = setTimeout(burst, every * (0.7 + Math.random() * 0.6));
    };

    timer = setTimeout(burst, 1500 + Math.random() * 3000);
    return () => clearTimeout(timer);
  }, [active, votesToday]); // eslint-disable-line react-hooks/exhaustive-deps

  const burstIds = Array.from(new Set(particles.filter(p => p.plusOne).map(p => p.id)));

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {burstIds.map(id => (
        <span key={`ring-${id}`} className="absolute inset-0 rounded-xl ring-2 ring-orange-500 animate-ring-pop" />
      ))}
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/3 animate-float-up drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]"
          style={{ animationDelay: `${p.delay}ms`, ['--drift' as string]: `${p.drift}px` }}
        >
          {p.plusOne ? (
            <span className="font-mono text-sm font-bold text-orange-400">+1</span>
          ) : (
            <IconVote className="h-4 w-4 text-orange-500" />
          )}
        </span>
      ))}
    </span>
  );
}
