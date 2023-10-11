'use client';

import Link from 'next/link';
import React, { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { inView, scroll } from 'framer-motion/dom';

interface Props {
  children: ReactNode;
  hash?: string;
  href?: string;
  sectionId?: string;
  className?: string;
  linkClassName?: string;
  isActive?: boolean;
  variant?: 'nonlink' | 'link';
}

export default ({ children, hash, href, sectionId, className = '', linkClassName, isActive, variant = 'link', ...props }: Props) => {
  const [isLinkActive, setLinkActive] = useState(isActive);
  const [selectedSection, setSelectedSection] = useState('');
  const pathname = usePathname();

  const customClassName = `inline-block rounded-full py-2 px-3 target:bg-slate-800 hover:bg-slate-800 duration-150 ${linkClassName}`;

  const handlehashUpdate = () => {
    const currentHash = window.location.hash;

    if (!currentHash) {
      if (hash === '#') {
        setLinkActive(true);
      } else {
        setLinkActive(false);
      }
    } else {
      if (currentHash === hash) {
        setLinkActive(true);
      } else {
        setLinkActive(false);
      }
    }
  };

  const handlePathUpdate = () => {
    setLinkActive(false);
    if (pathname == href) setLinkActive(true);
  };

  useEffect(() => {
    if (!href) {
      handlehashUpdate();
      window.addEventListener('hashchange', handlehashUpdate);
    } else {
      handlePathUpdate();
      // window.addEventListener('hashchange', handlePathUpdate)
    }
  }, [pathname]);

  const scrollToSection = () => {
    const sectionEl = document.getElementById(sectionId as string);
    sectionEl?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // document.querySelectorAll('*').forEach(element => {
    //   element.addEventListener('scroll', function (e) {
    //     const el = e.target as HTMLElement;
    //     const sectionEl = document.getElementById(sectionId as string);
    //     const rect = sectionEl?.getBoundingClientRect();
    //     const modalRec = document.querySelector('.view-modal')?.getBoundingClientRect();
    //     // console.log('offsetTop', sectionEl?.offsetTop);
    //     // console.log('rect', rect);
    //     console.log('scrollTop', el.scrollTop);
    //     setLinkActive(false);
    //     if (sectionEl && el.scrollTop > sectionEl?.offsetTop) {
    //       setLinkActive(true);
    //     }
    //   });
    // });
  }, []);

  return (
    <li
      className={`flex-none inline-block py-2 border-b ${
        isLinkActive ? 'border-slate-600 text-slate-200' : ' border-transparent'
      } ${className}`}
    >
      {variant == 'link' ? (
        href ? (
          <Link href={href} className={customClassName}>
            {children}
          </Link>
        ) : (
          <a {...props} href={`${window && window.location.pathname}${hash}`} className={customClassName}>
            {children}
          </a>
        )
      ) : (
        <button onClick={scrollToSection} {...props} className={customClassName}>
          {children}
        </button>
      )}
    </li>
  );
};
