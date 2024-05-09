'use client';

import { IconChatBubbleLeft } from '@/components/Icons';
import LinkItem from '../Link/LinkItem';
import { IconChatBubbleOvalLeftEllipsis } from '@/components/Icons';
import { useEffect, useState } from 'react';
import johnPicture from '@/public/johnrush.jpeg';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/solid';
import * as Popover from '@radix-ui/react-popover';

function TwitterLink() {
  return (
    <a
      className="fixed bottom-[40px] md:bottom-0 right-0 bg-slate-900 py-1 px-2 z-10 cursor-pointer rounded-tl-xl border-t border-l border-slate-600 border-dashed text-sm font-semibold hover:bg-base-200 duration-200 group"
      href="https://twitter.com/johnrushx"
      target="_blank"
    >
      <div className="flex opacity-75 hover:opacity-100 text-orange-100 flex-row justify-center items-center text-center gap-1.5">
        <div> <span className="text-orange-500 text-xs font-bold">John Rush</span></div>
        <div className="avatar -mt-1 -mb-1">
          <div className="relative w-7 rounded-full group-hover:rotate-12 group-hover:scale-110 duration-300">
          <Image src={johnPicture} width={32} height={32} className="flex-none w-8 h-8 object-cover rounded-full" alt="John rush" />
          </div>
        </div>
      </div>
    </a>
  );
}

export default () => {
  const [isPopupActive, setPopupActive] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setPopupActive(false);
    }, 6000);
  }, []);

  return (
    <TwitterLink/>
  );
};
