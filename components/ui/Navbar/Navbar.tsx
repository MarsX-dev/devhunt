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
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import categories from '@/utils/categories';

export default () => {
  const [isActive, setActive] = useState(false);
  const [isCommandActive, setCommandActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState<Product[]>([]);

  const browserService = createBrowserClient();
  const toolsService = new ProductsService(browserService);

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
    { title: 'This Week', path: '/' },
    // { title: 'Browse tools', path: '/upcoming' },
    { title: 'The Story', path: '/about' },
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

  useEffect(() => setActive(false), [pathname]);

  return (
    <>
      <nav className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 w-full">
        <div className="custom-screen items-center py-3 md:flex">
          <div className="flex items-center justify-between md:block">
            <Link href="/">
              <Brand />
            </Link>
            <div className="flex gap-x-4 items-center md:hidden">
              <button onClick={() => setCommandActive(true)} className="text-slate-400 hover:text-slate-200">
                <IconSearch />
              </button>
              <ButtonMenu isActive={isActive} setActive={() => setActive(!isActive)} />
              <div className="md:hidden">
                <AvatarMenu session={session} onLogout={handleLogout} />
              </div>
            </div>
          </div>
          <div className={`flex-1 md:static  ${isActive ? 'w-full fixed top-20 inset-x-0 px-4 md:px-0' : 'hidden md:block'}`}>
            <div className="p-4 px-4 mt-8 text-sm bg-slate-900 rounded-lg md:block md:mt-0 md:p-0 md:bg-transparent">
              <ul className="justify-end items-center space-y-6 text-slate-400 md:flex md:space-x-6 md:space-y-0">
                <li>
                  <NavigationMenu.Root>
                    <NavigationMenu.List className="">
                      <NavigationMenu.Item>
                        <NavigationMenu.Trigger className="hover:text-slate-200">Browse tools</NavigationMenu.Trigger>

                        <NavigationMenu.Content className="top-8 left-0 text-sm py-4 rounded-lg w-80 md:px-4 md:bg-slate-800 md:absolute">
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
                            <h3 className="text-sm font-medium text-slate-300">Categories</h3>
                            <ul className="mt-2 gap-y-3 grid grid-cols-2">
                              {categories.map((item, idx) => {
                                return (
                                  <li key={idx} className="hover:text-slate-200 duration-150">
                                    <Link href={`/tools/${item}`} className="block">
                                      {item}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </NavigationMenu.Content>
                      </NavigationMenu.Item>
                    </NavigationMenu.List>
                  </NavigationMenu.Root>
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
                <li className="hidden md:block">
                  <button onClick={() => setCommandActive(true)} className="hover:text-slate-200">
                    <IconSearch />
                  </button>
                </li>
                <li className="hidden w-px h-6 bg-slate-700 md:block"></li>
                <li className={`space-y-3 items-center gap-x-6 md:flex md:space-y-0 ${isLoggedin ? 'hidden md:flex' : ''}`}>
                  <Auth onLogout={handleLogout} />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
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
      <BlurBackground className="md:hidden z-20" isActive={isActive} setActive={() => setActive(false)} />
    </>
  );
};
