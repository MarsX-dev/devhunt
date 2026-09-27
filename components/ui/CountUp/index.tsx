'use client';

import { useEffect, useState } from 'react';

// A number that counts up to its real value after load (ease-out). Width is reserved with tabular
// digits and the final value's length, so nothing around it moves.
export default function CountUp({ value, from = 0.97, duration = 1800 }: { value: number; from?: number; duration?: number }) {
  const start = Math.floor(value * from);
  const [shown, setShown] = useState(value); // server render: the real value
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let t0 = 0;
    setShown(start);
    const tick = (t: number) => {
      t0 ||= t;
      const p = Math.min(1, (t - t0) / duration);
      setShown(Math.round(start + (value - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    const delay = setTimeout(() => (frame = requestAnimationFrame(tick)), 300);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(frame);
    };
  }, [value, start, duration]);
  const final = value.toLocaleString('en-US');
  return (
    <span className="inline-block text-right tabular-nums" style={{ minWidth: `${final.length}ch` }}>
      {shown.toLocaleString('en-US')}
    </span>
  );
}
