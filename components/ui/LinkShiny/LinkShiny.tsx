import mergeTW from "@/libs/mergeTW";
import { AppProps } from "next/app";
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
    href: string
    children?: ReactNode
    className?: string

}
export default ({ children, href, className }: Props) => {
    return (
        <Link href={href} className={mergeTW(`py-3 px-4 font-medium text-center text-white active:shadow-none rounded-lg shadow bg-slate-800 md:bg-[linear-gradient(179.23deg,_#1E293B_0.66%,_rgba(30,_41,_59,_0)_255.99%)] hover:bg-slate-700 duration-150 ${className}`)}>
            {children}
        </Link>
    )
}