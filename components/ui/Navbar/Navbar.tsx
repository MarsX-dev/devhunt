"use client";

import { ChangeEventHandler, useState } from 'react'
import Brand from '../Brand';
import Link from 'next/link';
import ButtonMenu from './ButtonMenu';
import { IconSearch } from '@/components/Icons';
import LinkShiny from '../LinkShiny/LinkShiny';
import CommandPalette from '../CommandPalette/CommandPalette';
import BlurBackground from '../BlurBackground/BlurBackground';
import { IProductResult } from '@/type';
import mockproducts from '@/mockproducts';

export default () => {

    const [isActive, setActive] = useState<boolean>(false)
    const [isCommandActive, setCommandActive] = useState<boolean>(false)
    const [searchValue, setSearchValue] = useState<string>("")
    const [searchResult, setSearchResult] = useState<IProductResult[]>([])

    const navigation = [
        { title: "Products", path: "/products" },
        { title: "About", path: "/about" },
        { title: "Learn how to post", path: "/learn-how-to-post" },
    ]

    const trend = [
        {
            name: "Resend",
            href: "/"
        },
        {
            name: "MarsX",
            href: "/"
        },
        {
            name: "Float UI",
            href: "/"
        },
        {
            name: "Lost Pixel",
            href: "/"
        },
    ]

    const handleSearch = (value: string) => {
        setSearchValue(value);
        const getResults = mockproducts.filter((item) =>
          item.name.toLocaleLowerCase().includes(value.toLowerCase())
        );
        setSearchResult(getResults);
      };

    return (
        <>
        <nav className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 w-full">
            <div className="custom-screen items-center py-3 md:flex">
                <div className="flex items-center justify-between md:block">
                    <Link href="/">
                        <Brand />
                    </Link>
                    <div className="flex gap-x-4 items-center md:hidden">
                    <button onClick={() => setCommandActive(true)} className='text-slate-400 hover:text-slate-200'>
                        <IconSearch />
                    </button>
                        <ButtonMenu isActive={isActive} setActive={() => setActive(!isActive)} />
                    </div>
                </div>
                <div className={`flex-1 md:static  ${isActive ? 'w-full fixed inset-x-0 px-4 md:px-0' : 'hidden md:block'}`}>
                <div className="p-4 px-4 mt-8 text-sm bg-slate-900 rounded-lg md:block md:mt-0 md:p-0 md:bg-transparent">
                    <ul className="justify-end items-center space-y-6 text-slate-400 md:flex md:space-x-6 md:space-y-0">
                        {
                            navigation.map((item, idx) => {
                                return (
                                    <li key={idx} className="hover:text-slate-200">
                                        <Link href={item.path} className="block">
                                            {item.title}
                                        </Link>
                                    </li>
                                )
                            })
                        }
                        <li>
                            <button onClick={() => setCommandActive(true)} className='hover:text-slate-200 hidden md:block'>
                                <IconSearch />
                            </button>
                        </li>
                        <li className='hidden w-px h-6 bg-slate-700 md:block'></li>
                        <li className='space-y-3 items-center gap-x-6 md:flex md:space-y-0'>
                            <Link href="/" className="block py-2.5 text-center hover:text-slate-200 border border-slate-800 hover:border-slate-600 rounded-lg md:border-none duration-150">
                                Log in
                            </Link>
                            <LinkShiny href='/' className='block'>
                                Sign in
                            </LinkShiny>
                        </li>
                    </ul>
                </div>
                </div>
            </div>
        </nav>
        <CommandPalette
            isCommandActive={isCommandActive}
            trend={trend} 
            setCommandActive={() => {
                setCommandActive(false)
                setSearchValue("")
            }}
            searchValue={searchValue} 
            setSearch={handleSearch} 
            searchResult={searchResult} 
        />
        <BlurBackground className='md:hidden' isActive={isActive} setActive={() => setActive(false)} />
        </>
    )
}