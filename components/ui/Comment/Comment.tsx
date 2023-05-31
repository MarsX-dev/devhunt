import mergeTW from '@/utils/mergeTW'
import { ReactNode } from 'react'

export const Comment = ({
  children,
  className,
  ...props
}: {
  children: ReactNode
  className?: string
  id?: string
}) => (
  <li {...props} className={mergeTW(`relative flex gap-6 pb-12 ${className}`)}>
    <span className="absolute left-[18px] inset-y-0 my-auto h-full w-1 bg-slate-800 comment-divided-bar"></span>
    {children}
  </li>
)
