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
