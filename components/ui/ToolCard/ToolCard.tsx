'use client';

import mergeTW from '@/utils/mergeTW';
import { MouseEvent, ReactNode, useEffect, useState } from 'react';
import ToolViewModal from '../ToolViewModal';
import { type ProductType } from '@/type';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default ({ href, className, tool, children }: { href: string; className?: string; tool?: ProductType; children?: ReactNode }) => {
  const [isToolViewActive, setToolViewActive] = useState(false);
  const [toolState, setTool] = useState(tool);

  const router = useRouter();

  const closeViewModal = () => {
    setToolViewActive(false);
    document.body.classList.remove('overflow-hidden');
  };

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    setTimeout(() => document.getElementById('nprogress')?.classList.add('hidden'), 200);
    if ((e.target as HTMLDivElement).getAttribute('id') != 'vote-item') {
      setTool(tool);
      window.history.pushState({ href }, '', href);
      setToolViewActive(true);
      document.body.classList.add('overflow-hidden');
    }
  };

  useEffect(() => {
    window.addEventListener('popstate', e => {
      setToolViewActive(false);
      document.body.classList.remove('overflow-hidden');
    });
  }, []);

  useEffect(() => {
    document.body.classList.remove('overflow-hidden');
    document.getElementById('nprogress')?.classList.remove('hidden');
  }, [router]);

  return (
    <>
      <Link
        href={href}
        onClick={handleClick}
        className={mergeTW(`flex items-start gap-x-4 relative py-4 rounded-2xl cursor-pointer group ${className}`)}
      >
        {children}
        <div className="absolute -z-10 -inset-2 rounded-2xl group-hover:bg-slate-800/60 opacity-0 group-hover:opacity-100 duration-150 sm:-inset-3"></div>
      </Link>
      {isToolViewActive ? <ToolViewModal close={closeViewModal} tool={toolState as ProductType} href={href} /> : ''}
    </>
  );
};
