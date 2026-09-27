'use client';

import mergeTW from '@/utils/mergeTW';
import { MouseEvent, ReactNode, useEffect, useState } from 'react';
import ToolViewModal from '../ToolViewModal';
import { type ProductType } from '@/type';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerToolCard } from '@/utils/toolCardRegistry';

export default ({
  href,
  className,
  tool,
  children,
  below,
  votesToday,
}: {
  href: string;
  className?: string;
  tool?: ProductType;
  children?: ReactNode;
  below?: ReactNode; // under the row, inside the card (clickable, covered by the hover background)
  votesToday?: number; // forwarded to the preview modal
}) => {
  const [isToolViewActive, setToolViewActive] = useState(false);
  const [toolState, setTool] = useState(tool);

  const router = useRouter();
  const pathname = usePathname();

  const closeViewModal = () => {
    setToolViewActive(false);
    router.back();
  };

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    setTimeout(() => document.getElementById('nprogress')?.classList.add('hidden'), 200);
    const targetId = (e.target as HTMLDivElement).getAttribute('id');
    if (targetId != 'vote-item' && targetId != 'tool-title') {
      setTool(tool);
      window.history.pushState({ href }, '', href);
      setToolViewActive(true); // the modal locks page scrolling while it's open
    }
  };

  useEffect(() => (tool ? registerToolCard(tool, votesToday) : undefined), [tool, votesToday]);

  useEffect(() => {
    const onPop = () => setToolViewActive(false);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => setToolViewActive(false), [pathname]);

  return (
    <>
      {/* data-no-instant-nav: a click opens the preview modal in place, not a navigation (see InstantNav). */}
      <div className="relative group group/card" data-tool-card-id={tool?.id} data-no-instant-nav>
        <div onClick={handleClick} className="cursor-pointer">
          <div className={mergeTW(`flex items-start gap-x-4 relative py-4 ${className}`)}>{children}</div>
          {below}
        </div>
        {/* Wider than the card but never taller: the card's own padding is the vertical gap, so the
            hover background can't run into the neighbouring rows or the heading above. */}
        <div className="absolute -z-10 -inset-x-2 inset-y-0 rounded-2xl bg-slate-800/40 opacity-0 group-hover:opacity-100 duration-150 sm:-inset-x-3"></div>
      </div>
      {isToolViewActive ? <ToolViewModal close={closeViewModal} tool={toolState as ProductType} href={href} votesToday={votesToday} /> : ''}
    </>
  );
};
