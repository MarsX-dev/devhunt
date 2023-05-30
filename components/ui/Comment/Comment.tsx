import mergeTW from '@/utils/mergeTW'
import { ReactNode } from 'react'

export const Comment = ({ children, className }: { children: ReactNode; className?: string }) => (
  <li className={mergeTW(`relative flex gap-6 pb-12 ${className}`)}>
    <span className="absolute left-[18px] inset-y-0 my-auto h-full w-1 bg-slate-800 comment-divided-bar"></span>
    {children}
  </li>
)
