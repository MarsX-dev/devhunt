import { IconHeart } from '@/components/Icons'
import mergeTW from '@/utils/mergeTW'
import { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLButtonElement> {
  className?: string
  count?: number
}

export const CommentLike = ({ children, className, count = 0, ...props }: Props) => (
  <button
    {...props}
    className={mergeTW(
      `${
        count > 0 ? 'text-red-500' : 'text-slate-400'
      } inline-flex items-center gap-x-2 text-xs font-medium p-1.5 px-2 rounded-full bg-slate-800 hover:bg-slate-700/60 active:hover:bg-slate-700 border border-slate-700 duration-150 ${className}`
    )}
  >
    <IconHeart className="w-3 h-3" />
    {count > 0 ? <span className={count > 0 ? 'text-slate-200' : 'text-slate-400'}>{count}</span> : ''}
  </button>
)
