'use client';

import mergeTW from '@/utils/mergeTW';
import { MouseEvent, ReactNode, useEffect, useState } from 'react';
import ToolViewModal from '../ToolViewModal';
import { type ProductType } from '@/type';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerToolCard } from '@/utils/toolCardRegistry';
import { setPreviewUrl } from '@/utils/pageView';

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
    setPreviewUrl(null);
    setToolViewActive(false);
    router.back();
  };

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    setTimeout(() => document.getElementById('nprogress')?.classList.add('hidden'), 200);
    const targetId = (e.target as HTMLDivElement).getAttribute('id');
    if (targetId != 'vote-item' && targetId != 'tool-title') {
      setTool(tool);
      setPreviewUrl(href); // not a page view (see utils/pageView)
      window.history.pushState({ href }, '', href);
      setToolViewActive(true); // the modal locks page scrolling while it's open
    }
  };

  useEffect(() => (tool ? registerToolCard(tool, votesToday) : undefined), [tool, votesToday]);

  // Coming Back to the history entry the preview created (e.g. after following a link inside it), Next 14
  // restores this list page with /tool/... in the URL: reopen the preview it belongs to.
  useEffect(() => {
    if (tool && pathname === href) {
      setPreviewUrl(href);
      setToolViewActive(true);
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      setPreviewUrl(null);
      setToolViewActive(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Next 14 syncs history.pushState/replaceState with the router, so opening the modal (which puts
  // /tool/... in the URL) and stepping through tools change the pathname too. Only a navigation away
  // from this page closes it.
  const [pagePath] = useState(pathname);
  useEffect(() => {
    if (pathname !== pagePath && !pathname?.startsWith('/tool/')) setToolViewActive(false);
  }, [pathname, pagePath]);

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
