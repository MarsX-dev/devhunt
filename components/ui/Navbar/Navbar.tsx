'use client';

import { type MouseEvent, useEffect, useState } from 'react';
import Brand from '../Brand';
import Link from 'next/link';
import { trackStep } from '@/utils/funnelClient';
import ButtonMenu from './ButtonMenu';
import Auth from '../Auth';
import { usePathname, useRouter } from 'next/navigation';
import CommandPalette from '../CommandPalette/CommandPalette';
import BlurBackground from '../BlurBackground/BlurBackground';
import AvatarMenu from '../AvatarMenu';
import { useSupabase } from '@/components/supabase/provider';
import { IconSearch } from '@/components/Icons';
import categories from '@/utils/categories';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import NewsletterInbox from '../Newsletter/NewsletterInbox';
import { ChartNoAxesColumn, LayoutGrid, Menu, Search } from 'lucide-react';
import useOnclickOutside from 'react-cool-onclickoutside';
import { prefetchRoute } from '@/utils/prefetch';

export default () => {
  const [isActive, setActive] = useState(false);
  const [isNavMenuActive, setNavMenuActive] = useState(false);
  const [isCommandActive, setCommandActive] = useState(false);


  const NavMenuRef = useOnclickOutside(() => {
    setNavMenuActive(false);
  });

  const router = useRouter();
  const pathname = usePathname();

  const { supabase, session } = useSupabase();

  const isLoggedin = session?.user;

  // Submit goes straight to the form when we know the user has no tools yet (the dashboard stores
  // the count); otherwise the dashboard. Both are prefetched once we know who's signed in, so the
  // click is instant.
  const [knownNoTools, setKnownNoTools] = useState(false);
  useEffect(() => {
    try {
      setKnownNoTools(localStorage.getItem('dh_my_tools') === '0');
    } catch {}
  }, [pathname]);
  const submitPath = !isLoggedin ? '/login' : knownNoTools ? '/account/tools/new' : '/account/tools?submit=1';
  useEffect(() => {
    const paths = isLoggedin ? ['/account/tools', '/account/tools/new', '/account/details'] : ['/login'];
    const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
    idle(() => paths.forEach(path => prefetchRoute(router, path)));
  }, [isLoggedin]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    router.push('/');
    if (error != null) {
      console.log({ error });
    }
  };

  const navigation = [
    { title: 'Advertise', path: '/advertise', className: 'text-orange-400 hover:text-orange-300' },
    {
      title: 'Submit',
      path: submitPath,
      className: 'bg-slate-50 hover:bg-white text-slate-900 font-medium text-center rounded-full px-3 py-1 duration-150',
    },
  ];
  const submenu = [
    { title: 'All DevTools', path: '/all-dev-tools' },
    { title: 'This Week', path: '/' },
    { title: 'Upcoming Tools', path: '/upcoming' },
    { title: 'Best DevTools On Product Hunt', path: '/best-dev-tools-this-week-on-product-hunt' },
  ];

  // Picking a link closes the menus right away, not when the new page arrives: until then they'd sit
  // under the loading skeleton and show up again once the page renders.
  const closeMenusOnLink = (e: MouseEvent) => {
    if (!(e.target as Element).closest('a')) return;
    setActive(false);
    setNavMenuActive(false);
  };
  const prefetchSubmenu = () => submenu.forEach(item => prefetchRoute(router, item.path));

  // ⌘K / Ctrl+K or "/" opens search (not while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea, [contenteditable="true"]');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setCommandActive(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setActive(false);
    setNavMenuActive(false);
  }, [pathname]);

  return (
    <>
      <nav className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/70 w-full">
        <div className="custom-screen items-center py-2 lg:flex lg:h-12 lg:py-0">
          <div className="flex items-center justify-between lg:block">
            <Link href="/" aria-label="DevHunt home">
              <Brand w="100" h="28" />
            </Link>
            <div className="flex gap-x-4 items-center lg:hidden">
              <button aria-label="Search button" onClick={() => setCommandActive(true)} className="text-slate-400 hover:text-slate-200">
                <IconSearch />
              </button>
              <ButtonMenu isActive={isActive} setActive={() => setActive(!isActive)} />
              <div className="lg:hidden">
                <AvatarMenu session={session} onLogout={handleLogout} />
              </div>
            </div>
          </div>
          <div onClick={closeMenusOnLink} className={`flex-1 lg:static  ${isActive ? 'w-full fixed top-14 h-[calc(100dvh-3.5rem)] inset-x-0 px-4 pb-20 overflow-y-auto overscroll-contain lg:px-0' : 'hidden lg:block'}`}>
            <div className="p-4 px-4 mt-8 text-sm bg-slate-900 rounded-lg lg:block lg:mt-0 lg:p-0 lg:bg-transparent">
              <ul className="justify-end items-center space-y-6 text-slate-400 lg:flex lg:space-x-4 lg:space-y-0">
                {!isLoggedin ? (
                  <li>
                    <NewsletterInbox />
                  </li>
                ) : (
                  ''
                )}
                <li className="hidden lg:block">
                  <button
                    aria-label="Search button"
                    title="Search (⌘K)"
                    onClick={() => setCommandActive(true)}
                    className="flex rounded-full p-1.5 hover:bg-slate-800 hover:text-slate-200"
                  >
                    <Search className="h-[18px] w-[18px]" />
                  </button>
                </li>
                <li>
                  <div ref={NavMenuRef} className="relative">
                    <button
                      onClick={() => {
                        if (!isNavMenuActive) prefetchSubmenu();
                        setNavMenuActive(!isNavMenuActive);
                      }}
                      onMouseEnter={prefetchSubmenu}
                      aria-label="Browse tools"
                      aria-expanded={isNavMenuActive}
                      title="Browse tools"
                      className={`group flex items-center gap-x-2 hover:text-slate-200 lg:rounded-full lg:p-1.5 lg:hover:bg-slate-800 ${isNavMenuActive ? 'lg:bg-slate-800 lg:text-slate-200' : ''}`}
                    >
                      <Menu className="hidden h-[18px] w-[18px] lg:block" />
                      <LayoutGrid className="h-[18px] w-[18px] lg:hidden" />
                      <span className="lg:sr-only">Browse tools</span>
                      <ChevronDownIcon className="h-4 w-4 lg:hidden" />
                    </button>
                    <div
                      className={`top-10 right-0 text-sm py-4 rounded-lg w-80 lg:px-4 lg:bg-slate-800 lg:absolute lg:shadow-2xl lg:shadow-black/40 ${
                        isNavMenuActive ? '' : 'hidden'
                      }`}
                    >
                      <div className="space-y-4">
                        <ul className="mt-2 space-y-3">
                          {submenu.map((item, idx) => {
                            return (
                              <li key={idx} className="hover:text-slate-200 duration-150">
                                <Link href={`${item.path}`} className="block">
                                  {item.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                        <h3 className="text-[0.855rem] font-medium text-slate-300">Categories</h3>
                        <ul className="mt-2 gap-y-3 grid grid-cols-2">
                          {categories.map((item, idx) => {
                            return (
                              <li key={idx} className="hover:text-slate-200 duration-150">
                                <Link href={`/tools/${item.name.toLowerCase().replaceAll(' ', '-')}`} className="block">
                                  {item.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <Link
                    href="/stats"
                    title="Stats"
                    aria-label="Stats"
                    className="flex items-center gap-x-2 hover:text-slate-200 lg:rounded-full lg:p-1.5 lg:hover:bg-slate-800"
                  >
                    <ChartNoAxesColumn className="h-[18px] w-[18px]" />
                    <span className="lg:sr-only">Stats</span>
                  </Link>
                </li>
                {navigation.map((item, idx) => {
                  return (
                    <li key={idx} className="hover:text-slate-200 lg:text-[13px]">
                      <Link
                        href={item.path}
                        className={`block ${item?.className || ''}`}
                        onClick={item.title === 'Submit' ? () => trackStep('submit_click', { logged_in: isLoggedin, from: 'navbar' }) : undefined}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
               
  
                <li className={`space-y-3 items-center gap-x-4 lg:flex lg:space-y-0 ${isLoggedin ? 'hidden lg:flex' : ''}`}>
                  <Auth onLogout={handleLogout} />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      <CommandPalette isCommandActive={isCommandActive} setCommandActive={setCommandActive} />
      <BlurBackground className="lg:hidden z-20" isActive={isActive} setActive={() => setActive(false)} />
    </>
  );
};
