'use client';
import { IconChatBubbleLeft } from '@/components/Icons';
import LinkItem from '../Link/LinkItem';
import { IconChatBubbleOvalLeftEllipsis } from '@/components/Icons';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default () => {
  const [isPopupActive, setPopupActive] = useState(true);

  useEffect(() => {
    setTimeout(() => setPopupActive(false), 6000);
  }, []);
  return (
    <div
      onMouseEnter={() => setPopupActive(true)}
      onMouseLeave={() => setPopupActive(false)}
      onClick={() => setPopupActive(!isPopupActive)}
      className="fixed z-10 bottom-4 right-4 lg:bottom-14"
    >
      <button className="w-10 h-10 rounded-full text-white bg-orange-500 flex items-center justify-center group">
        <IconChatBubbleLeft />
      </button>
      <motion.div
        layout
        transition={{ delay: 0.3 }}
        animate={{ display: isPopupActive ? '' : 'none' }}
        style={{ display: 'none' }}
        className="fixed right-4 bottom-20 pl-4 sm:pl-0 lg:bottom-28"
      >
        <div className="p-4 flex flex-wrap items-start gap-3 max-w-xs shadow-md rounded-lg bg-slate-800 border-slate-800">
          <img src="/johnrush.png" className="flex-none w-8 h-8 object-cover rounded-full" />
          <div className="w-full text-sm text-left sm:w-auto">
            <p className="text-slate-100">You got a quetion? You can DM me!</p>
            <div className="flex items-center gap-x-2 mt-1">
              <span className="flex-none block w-2 h-2 rounded-full bg-green-500"></span>
              <p className="text-xs text-slate-300">Online, replies near instant</p>
            </div>
            <LinkItem
              href="https://twitter.com/messages/compose?recipient_id=1456321269029380097"
              target="_blank"
              className="mt-2 w-full flex items-center justify-center gap-x-2 bg-orange-500 hover:bg-orange-600 text-xs py-2"
            >
              <IconChatBubbleOvalLeftEllipsis className="w-4 h-4" />
              Contact johnrush
            </LinkItem>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
