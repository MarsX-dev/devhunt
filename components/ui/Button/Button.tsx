import { IconLoading } from '@/components/Icons'
import mergeTW from '@/libs/mergeTW'
import { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string,
  isLoad?: boolean,
  variant?: "shiny" | "default"
}

export default ({ children, className = '', variant = "default", isLoad = false, ...props }: Props) => {

  const variants = {
    shiny: "py-3 px-4 font-medium text-center text-white active:shadow-none rounded-lg shadow bg-slate-700 md:bg-[linear-gradient(179.23deg,_#1E293B_0.66%,_rgba(30,_41,_59,_0)_255.99%)] hover:bg-slate-800 duration-150",
    default: "py-3 px-4 rounded-lg duration-150 font-medium text-center text-sm text-white bg-indigo-500"
  }

  return (
    <button
      {...props}
      className={mergeTW(
        `${variants[variant]} ${isLoad ? "flex items-center" : ""} ${className}`
      )}
    >
      {
        isLoad ? (
          <IconLoading />
        ) : ""
      }
      {children}
    </button>
  )
}
