'use client';

import { IconFirstWinnerBadge, IconSecondWinnerBadge, IconThirdWinnerBadge } from '@/components/Icons';
import { ProductAward } from '@/utils/supabase/CustomTypes';
import JSConfetti from 'js-confetti';
import { useEffect, useRef, useState } from 'react';

const badges = {
  winner1: {
    badge: <IconFirstWinnerBadge className="mx-auto" />,
    rank: '1st',
  },
  winner2: {
    badge: <IconSecondWinnerBadge className="mx-auto" />,
    rank: '2nd',
  },
  winner3: {
    badge: <IconThirdWinnerBadge className="mx-auto" />,
    rank: '3th',
  },
};

export default ({ weekRank, isLaunchEnd }: { weekRank: number | string; isLaunchEnd: boolean }) => {
  const jsConfettiRef = useRef<JSConfetti>();
  const [confettiTimes, setConfettiTime] = useState(1);

  useEffect(() => {
    jsConfettiRef.current = new JSConfetti();
    const toolHref = localStorage.getItem('tool_href');
    const currentHref = window.location.href;
    if (jsConfettiRef.current && !toolHref && isLaunchEnd && (badges as any)[`winner${weekRank}`]) {
      jsConfettiRef.current && jsConfettiRef.current.addConfetti({ confettiNumber: 600 });
      if (confettiTimes < 3) {
        setTimeout(() => {
          setConfettiTime(n => n + 1);
        }, 1000);
      }
      confettiTimes == 3 ? localStorage.setItem('tool_href', currentHref) : '';
    }
  }, [confettiTimes]);

  return isLaunchEnd && (badges as any)[`winner${weekRank}`] ? (
    <div className="text-center text-slate-300 text-sm">
      {(badges as any)[`winner${weekRank}`].badge}
      <span className="block text-xl text-slate-50 font-semibold mt-2">{(badges as any)[`winner${weekRank}`].rank}</span>
      Product of the week
    </div>
  ) : (
    <></>
  );
};
