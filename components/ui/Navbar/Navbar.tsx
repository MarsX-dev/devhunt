'use client';

import { useEffect, useState } from 'react';
import Brand from '../Brand';
import Link from 'next/link';
import ButtonMenu from './ButtonMenu';
import Auth from '../Auth';
import { usePathname, useRouter } from 'next/navigation';
import CommandPalette from '../CommandPalette/CommandPalette';
import BlurBackground from '../BlurBackground/BlurBackground';
import AvatarMenu from '../AvatarMenu';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { type Product } from '@/utils/supabase/types';
import { IconSearch } from '@/components/Icons';
import categories from '@/utils/categories';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';
import NewsletterModal from '../NewsletterModal';
import { BellAlertIcon, BellIcon } from '@heroicons/react/24/outline';
import useOnclickOutside from 'react-cool-onclickoutside';

export default () => {
  const [isActive, setActive] = useState(false);
  const [isNewsletterModalActive, setNewsletterModalActive] = useState(false);
  const [isBannerActive, setBannerActive] = useState(false);
  const [isNavMenuActive, setNavMenuActive] = useState(false);
  const [isCommandActive, setCommandActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState<Product[]>([]);

  const browserService = createBrowserClient();
  const toolsService = new ProductsService(browserService);

  const NavMenuRef = useOnclickOutside(() => {
    setNavMenuActive(false);
  });

  const router = useRouter();
  const pathname = usePathname();

  const { supabase, session } = useSupabase();

  const isLoggedin = session?.user;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    router.push('/');
    if (error != null) {
      console.log({ error });
    }
  };

  const navigation = [
    { title: 'The Story', path: '/the-story' },
    {
      title: 'Submit your Dev Tool',
      path: isLoggedin ? '/account/tools' : '/login',
      className: 'bg-orange-500 hover:bg-orange-600 text-white text-center rounded-lg px-3 p-2 duration-150 btnshake',
    },
  ];

  const submenu = [
    { title: 'This Week', path: '/' },
    { title: 'Upcoming Tools', path: '/upcoming' },
  ];

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setTimeout(() => {
      toolsService.search(value).then(data => {
        setSearchResult(data as Product[]);
      });
    }, 50);
  };

  useEffect(() => {
    setActive(false);
    setBannerActive(localStorage.getItem('isNewsletterActive') ? false : true);
  }, [pathname]);

  return (
    <>
      <nav className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 w-full">
        <div className="custom-screen items-center py-3 lg:flex">
          <div className="flex items-center justify-between lg:block">
            <Link href="/">
              <Brand />
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
          <div className={`flex-1 lg:static  ${isActive ? 'w-full fixed top-20 inset-x-0 px-4 lg:px-0' : 'hidden lg:block'}`}>
            <div className="p-4 px-4 mt-8 text-sm bg-slate-900 rounded-lg lg:block lg:mt-0 lg:p-0 lg:bg-transparent">
              <ul className="justify-end items-center space-y-6 text-slate-400 lg:flex lg:space-x-6 lg:space-y-0">
                {!isLoggedin ? (
                  <li>
                    <button onClick={() => setNewsletterModalActive(true)} className="flex items-center gap-x-2 hover:text-slate-200">
                      <BellIcon className="w-5 h-5" />
                      Subscribe
                    </button>
                  </li>
                ) : (
                  ''
                )}
                <li>
                  <div ref={NavMenuRef} className="relative">
                    <button
                      onClick={() => setNavMenuActive(!isNavMenuActive)}
                      className="flex items-center gap-x-2 hover:text-slate-200 group"
                    >
                      Browse tools
                      <ChevronDownIcon className="w-4 h-4 transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180" />
                    </button>
                    <div
                      className={`top-8 left-0 text-sm py-4 rounded-lg w-80 lg:px-4 lg:bg-slate-800 lg:absolute ${
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
                {navigation.map((item, idx) => {
                  return (
                    <li key={idx} className="hover:text-slate-200">
                      <Link href={item.path} className={`block ${item?.className || ''}`}>
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
                <li className="hidden lg:block">
                  <button aria-label="Search button" onClick={() => setCommandActive(true)} className="hover:text-slate-200">
                    <IconSearch />
                  </button>
                </li>
                <li className="hidden w-px h-6 bg-slate-700 lg:block"></li>
                <li className={`space-y-3 items-center gap-x-6 lg:flex lg:space-y-0 ${isLoggedin ? 'hidden lg:flex' : ''}`}>
                  <Auth onLogout={handleLogout} />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      {isBannerActive && !isLoggedin ? (
        <div className="animate-bottom-bannner fixed bottom-10 inset-x-0 z-30 max-w-xl mx-auto px-4">
          <div className=" flex items-center gap-x-3 bg-slate-800 p-3 rounded-lg">
            <div className="flex items-center justify-center rounded-full w-12 h-12 border-slate-700 bg-slate-900/70 text-slate-300">
              <BellAlertIcon className="w-6 h-6" />
            </div>
            <p className="flex-1 text-sm text-slate-300">
              <button
                onClick={() => setNewsletterModalActive(true)}
                className="text-slate-100 hover:text-orange-500 duration-150 underline"
              >
                Subscribe
              </button>{' '}
              to get weekly email with best new dev tools.
            </p>
            <button
              onClick={() => {
                setBannerActive(false);
                localStorage.setItem('isNewsletterActive', 'true');
              }}
              className="p-1 rounded-md text-slate-400 hover:bg-slate-700 duration-150"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        ''
      )}
      <NewsletterModal isActive={isNewsletterModalActive} closeModal={setNewsletterModalActive} />
      <CommandPalette
        isCommandActive={isCommandActive}
        setCommandActive={() => {
          setCommandActive(false);
          setSearchValue('');
        }}
        searchValue={searchValue}
        setSearch={handleSearch}
        searchResult={searchResult}
      />
      <BlurBackground className="lg:hidden z-20" isActive={isActive} setActive={() => setActive(false)} />
    </>
  );
};
