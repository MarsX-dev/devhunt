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
  votesToday,
}: {
  href: string;
  className?: string;
  tool?: ProductType;
  children?: ReactNode;
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
      <div className="relative group group/card" data-tool-card-id={tool?.id}>
        <div onClick={handleClick} className={mergeTW(`flex items-start gap-x-4 relative py-4 rounded-2xl cursor-pointer ${className}`)}>
          {children}
        </div>
        <div className="absolute -z-10 -inset-2 rounded-2xl group-hover:bg-slate-800/40 opacity-0 group-hover:opacity-100 duration-150 sm:-inset-3"></div>
      </div>
      {isToolViewActive ? <ToolViewModal close={closeViewModal} tool={toolState as ProductType} href={href} votesToday={votesToday} /> : ''}
    </>
  );
};
