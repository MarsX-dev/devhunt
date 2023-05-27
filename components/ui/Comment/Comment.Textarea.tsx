import mergeTW from '@/libs/mergeTW'
import { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLTextAreaElement> {
  className?: string
  value?: string
}

export const CommentTextarea = ({ className = '', ...props }: Props) => (
  <textarea
    {...props}
    className={`text-sm text-slate-400 border-b border-slate-700 focus:border-slate-300 bg-transparent w-full outline-none h-32 duration-150 ${mergeTW(
      className
    )}`}
  />
)
