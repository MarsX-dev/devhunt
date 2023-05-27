import mergeTW from '@/libs/mergeTW'
import { ReactNode } from 'react'

export const Comment = ({ children, className }: { children: ReactNode; className?: string }) => (
  <li className={mergeTW(`relative flex gap-6 pb-12 ${className}`)}>
    <span className="absolute left-[18px] top-10 bottom-0 my-auto h-[67%] w-1 bg-slate-800 comment-divided-bar"></span>
    {children}
  </li>
)
